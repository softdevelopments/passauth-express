import express, { Router } from "express";
import Redis from "ioredis";
import {
  Column,
  DataType,
  Default,
  Model,
  Sequelize,
  Table,
} from "sequelize-typescript";
import { AuthRepo, PassauthConfiguration } from "passauth";
import { EmailPluginOptions, EmailSenderPlugin } from "@passauth/email-plugin";
import {
  AuthMiddleware,
  PassauthExpress,
  PassauthExpressConfig,
} from "../../src/index";
import type { User, UserRole } from "../../src/interfaces/user.types";
import { EmailClientTest } from "./EmailClient";

const redisClient = new Redis({
  host: "redis",
  port: 6379,
});

@Table
class UserModel extends Model {
  declare id: number;

  @Column({ type: DataType.STRING })
  email: string;

  @Column({ type: DataType.BOOLEAN })
  isBlocked: boolean;

  @Column({ type: DataType.STRING })
  password: string;

  @Default(false)
  @Column({ type: DataType.BOOLEAN })
  emailVerified: boolean;

  @Column({ type: DataType.ENUM("user", "admin") })
  role: UserRole;
}

export const setupApp = async (withEmailConfig = false) => {
  const app = express();

  const sequelize = new Sequelize({
    dialect: "postgres",
    host: "db",
    username: "postgres",
    password: "postgres",
    database: "passauth_express",
    port: 5432,
    models: [UserModel],
    define: {
      underscored: true,
    },
    logging: false,
  });

  await sequelize.authenticate();
  await sequelize.sync({ force: true });

  app.use(express.json());

  const passauthRepo = {
    getUser: async (user: Partial<User>) => {
      const foundUser = await UserModel.findOne({ where: user });

      return foundUser;
    },
    createUser: async (userDto) => {
      const newUser = await UserModel.create(userDto);

      newUser.save();

      return newUser;
    },
    saveCachedToken: async (userId, token, expiresInMs) => {
      await redisClient.set(`auth-token:${userId}`, token, "PX", expiresInMs);
    },
    getCachedToken: async (userId) => {
      const token = await redisClient.get(`auth-token:${userId}`);

      return token;
    },
    deleteCachedToken: async (userId) => {
      await redisClient.del(`auth-token:${userId}`);
    },
  } as AuthRepo<User>;

  const config = {
    secretKey: "secret-key",
    saltingRounds: 4,
    repo: passauthRepo,
  } as PassauthConfiguration<User, [ReturnType<typeof EmailSenderPlugin>]>;

  const emailClient = new EmailClientTest();

  const emailRepo = {
    confirmEmail: async (email: string) => {
      try {
        const user = await UserModel.findOne({ where: { email } });

        if (!user) {
          return false;
        }

        user.emailVerified = true;

        await user.save();

        return true;
      } catch (_error) {
        return false;
      }
    },
    resetPassword: async (email: string, password: string) => {
      try {
        const user = await UserModel.findOne({ where: { email } });

        if (!user) {
          return false;
        }

        user.password = password;

        await user.save();

        return true;
      } catch (_error) {
        return false;
      }
    },
  };
  const emailService = {
    createResetPasswordLink: async (email: string, token: string) => {
      return `http://passauth-express.com/reset-password?email=${email}&token=${token}`;
    },
    createConfirmEmailLink: async (email: string, token: string) => {
      return `http://passauth-express.com/confirm-email?email=${email}&token=${token}`;
    },
  };

  const emailConfig = {
    senderName: "Test Sender",
    senderEmail: "test@example.com",
    client: emailClient,
    services: emailService,
    repo: emailRepo,
  } as EmailPluginOptions;

  const passauthExpressConfig: PassauthExpressConfig = withEmailConfig
    ? {
        config,
        emailConfig,
      }
    : { config };

  const { setupRoutes, passauth } = PassauthExpress(passauthExpressConfig);

  const router = setupRoutes();

  app.use("/auth", router);
  app.get("/is-logged", AuthMiddleware(passauth), (req, res) => {
    res.send({ message: "ok" });
  });

  return {
    app,
    sequelize,
    emailClient,
    passauth: { repo: passauthRepo },
    emailPlugin: {
      emailRepo,
      emailService,
    },
  };
};

export { UserModel };
