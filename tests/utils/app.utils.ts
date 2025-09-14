import express from "express";
import {
  Column,
  DataType,
  Default,
  Model,
  Sequelize,
  Table,
} from "sequelize-typescript";
import { PassauthConfiguration } from "passauth";
import { EmailPluginOptions } from "@passauth/email-plugin";
import { PassauthExpress } from "../../src/index.js";
import type { UserRole } from "../../src/interfaces/user.types";
import { EmailClientTest } from "./EmailClient";

@Table
class User extends Model {
  declare id: number;

  @Column({ type: DataType.STRING })
  email: string;

  @Column({ type: DataType.STRING })
  password: string;

  @Default(false)
  @Column({ type: DataType.BOOLEAN })
  emailVerified: boolean;

  @Column({ type: DataType.ENUM("user", "admin") })
  role: UserRole;
}

export const setupApp = async () => {
  const app = express();

  const sequelize = new Sequelize({
    dialect: "postgres",
    host: "db",
    username: "postgres",
    password: "postgres",
    database: "passauth_express",
    port: 5432,
    models: [User],
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
      const foundUser = await User.findOne({ where: user });

      return foundUser;
    },
    createUser: async (userDto) => {
      const newUser = await User.create(userDto);

      newUser.save();

      return newUser;
    },
  };

  const config = {
    secretKey: "secret-key",
    saltingRounds: 4,
    repo: passauthRepo,
  } as PassauthConfiguration<User>;

  const emailClient = new EmailClientTest();

  const emailRepo = {
    confirmEmail: async (email: string) => {
      try {
        const user = await User.findOne({ where: { email } });

        if (!user) {
          return false;
        }

        user.emailVerified = true;

        await user.save();

        return true;
      } catch (error) {
        return false;
      }
    },
    resetPassword: async (email: string, password: string) => {
      try {
        const user = await User.findOne({ where: { email } });

        if (!user) {
          return false;
        }

        user.password = password;

        await user.save();

        return true;
      } catch (error) {
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

  const { router } = PassauthExpress(app, {
    config,
    emailConfig,
  });

  app.use("/auth", router);

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

export { User as UserModel };
