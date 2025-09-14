import request from "supertest";
import { Sequelize } from "sequelize";
import { Express } from "express";
import {
  jest,
  describe,
  expect,
  beforeAll,
  beforeEach,
  test,
  afterAll,
} from "@jest/globals";
import type { AuthRepo } from "passauth";
import type { EmailPluginOptions } from "@passauth/email-plugin";
import type { EmailClient } from "@passauth/email-plugin/interfaces";
import { setupApp, UserModel } from "../utils/app.utils";
import type { User } from "../../src/interfaces/user.types";
import { DEFAULT_CONFIRMATION_LINK_EXPIRATION_MS } from "@passauth/email-plugin/constants";

describe("Register with email-plugin", () => {
  let app: Express;
  let sequelize: Sequelize;
  let emailClient: EmailClient;

  beforeAll(async () => {
    const {
      app: appInstance,
      sequelize: sequelizeInstance,
      passauth: { repo: passauthRepoInstance },
      emailPlugin: {
        emailRepo: emailRepoInstance,
        emailService: emailServiceInstance,
      },
      emailClient: emailClientInstance,
    } = await setupApp();

    app = appInstance;
    sequelize = sequelizeInstance;
    passauthRepo = passauthRepoInstance;
    emailRepo = emailRepoInstance;
    emailService = emailServiceInstance;
    emailClient = emailClientInstance;
  });

  describe("Route /auth/register", () => {
    beforeEach(async () => {
      await sequelize.truncate({ cascade: true });
      jest.clearAllMocks();
    });

    test("Should send confirmation email to registered user", async () => {
      const emailSpy = jest.spyOn(emailClient, "send");

      const response = await request(app).post("/auth/register").send({
        email: "test@example.com",
        password: "password",
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty(
        "message",
        "Registration successful"
      );

      expect(emailSpy).toHaveBeenCalled();
      expect(emailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringMatching(
            /Confirm your email test@example.com by clicking on the following link: http:\/\/passauth-express.com\/confirm-email\?email=test@example.com&token=[\w-]+/
          ),
        })
      );
    });

    test("Should fail if email is already registered", async () => {
      await request(app)
        .post("/auth/register")
        .send({
          email: "test@example.com",
          password: "password",
        })
        .expect(201);

      await request(app)
        .post("/auth/register")
        .send({
          email: "test@example.com",
          password: "password",
        })
        .expect(400);
    });

    test("Should be able to confirm email by using the token sent to email", async () => {
      const emailSpy = jest.spyOn(emailClient, "send");

      await request(app)
        .post("/auth/register")
        .send({
          email: "test@example.com",
          password: "password",
        })
        .expect(201);

      const token = (emailSpy.mock.calls[0][0] as any).text.match(
        /token=([\w-]+)/
      )[1];

      const registeredUser = await UserModel.findOne({
        where: {
          email: "test@example.com",
        },
      });

      expect(registeredUser?.emailVerified).toBe(false);

      await request(app)
        .post("/auth/register/confirm-email")
        .send({
          email: "test@example.com",
          token: token,
        })
        .expect(200);

      const confirmedUser = await UserModel.findOne({
        where: {
          email: "test@example.com",
        },
      });

      expect(confirmedUser?.id).not.toBeNull();
      expect(confirmedUser?.id).toBe(registeredUser?.id);
      expect(confirmedUser?.emailVerified).toBe(true);
    });
  });

  describe("Route /auth/register/send-email", () => {
    beforeEach(async () => {
      await sequelize.truncate({ cascade: true });
      jest.clearAllMocks();
    });

    test("Should send confirmation email", async () => {
      const emailSpy = jest.spyOn(emailClient, "send");

      const response = await request(app)
        .get("/auth/register/send-email")
        .query({
          email: "test@example.com",
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "message",
        "Confirmation email sent"
      );
      expect(emailSpy).toHaveBeenCalled();
      expect(emailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringMatching(
            /Confirm your email test@example.com by clicking on the following link: http:\/\/passauth-express.com\/confirm-email\?email=test@example.com&token=[\w-]+/
          ),
        })
      );
    });

    test("Should invalidate the previous token", async () => {
      const emailSpy = jest.spyOn(emailClient, "send");

      await request(app)
        .post("/auth/register")
        .send({
          email: "test@example.com",
          password: "password",
        })
        .expect(201);

      const registerToken = (emailSpy.mock.calls[0][0] as any).text.match(
        /token=([\w-]+)/
      )[1];

      await request(app)
        .get("/auth/register/send-email")
        .query({
          email: "test@example.com",
        })
        .expect(200);

      const sendEmailToken = (emailSpy.mock.calls[1][0] as any).text.match(
        /token=([\w-]+)/
      )[1];

      expect(registerToken).not.toBe(sendEmailToken);

      await request(app)
        .post("/auth/register/confirm-email")
        .send({
          email: "test@example.com",
          token: registerToken,
        })
        .expect(400);

      const user = await UserModel.findOne({
        where: {
          email: "test@example.com",
        },
      });

      expect(user?.emailVerified).toBe(false);

      await request(app)
        .post("/auth/register/confirm-email")
        .send({
          email: "test@example.com",
          token: sendEmailToken,
        })
        .expect(200);

      const confirmedUser = await UserModel.findOne({
        where: {
          email: "test@example.com",
        },
      });

      expect(confirmedUser?.emailVerified).toBe(true);
    });

    test("Expirated token should not confirm email", async () => {
      jest.useFakeTimers();

      const emailSpy = jest.spyOn(emailClient, "send");

      await request(app)
        .post("/auth/register")
        .send({
          email: "test@example.com",
          password: "password",
        })
        .expect(201);

      const token = (emailSpy.mock.calls[0][0] as any).text.match(
        /token=([\w-]+)/
      )[1];

      jest.advanceTimersByTime(DEFAULT_CONFIRMATION_LINK_EXPIRATION_MS + 1000);

      await request(app)
        .post("/auth/register/confirm-email")
        .send({
          email: "test@example.com",
          token: token,
        })
        .expect(400);
    });
  });
});

describe("Login with email-plugin", () => {
  let app: Express;
  let sequelize: Sequelize;
  let passauthRepo: AuthRepo<User>;
  let emailRepo: EmailPluginOptions["repo"];
  let emailService: EmailPluginOptions["services"];
  let emailClient: EmailClient;

  beforeAll(async () => {
    const {
      app: appInstance,
      sequelize: sequelizeInstance,
      passauth: { repo: passauthRepoInstance },
      emailPlugin: {
        emailRepo: emailRepoInstance,
        emailService: emailServiceInstance,
      },
      emailClient: emailClientInstance,
    } = await setupApp();

    app = appInstance;
    sequelize = sequelizeInstance;
    passauthRepo = passauthRepoInstance;
    emailRepo = emailRepoInstance;
    emailService = emailServiceInstance;
    emailClient = emailClientInstance;
  });

  const registerAndConfirmUser = async (email: string, password: string) => {
    await request(app).post("/auth/register").send({
      email: "test@example.com",
      password: "password",
    });

    const registeredUser = await UserModel.findOne({
      where: {
        email: "test@example.com",
      },
    });

    if (registeredUser) {
      registeredUser.emailVerified = true;

      await registeredUser.save();
    }
  };

  describe("Route /auth/login", () => {
    beforeEach(async () => {
      await sequelize.truncate({ cascade: true });
      jest.clearAllMocks();

      await registerAndConfirmUser("test@example.com", "password");
    });

    afterAll(async () => {
      jest.clearAllMocks();
    });

    test("Should be able to login", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "test@example.com",
          password: "password",
        })
        .expect(200);

      expect(response.body).toHaveProperty("accessToken");
      expect(response.body).toHaveProperty("refreshToken");
    });

    test("Should not be able to login with unverified email", async () => {
      await request(app).post("/auth/register").send({
        email: "test2@example.com",
        password: "password2",
      });

      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "test2@example.com",
          password: "password2",
        })
        .expect(400);

      expect(response.body.error).toBe("Email not verified: test2@example.com");
    });
  });
});
