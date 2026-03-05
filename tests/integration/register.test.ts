/* eslint-disable @typescript-eslint/no-explicit-any */
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
} from "@jest/globals";
import type { EmailClient } from  "passauth/auth/interfaces";
import { setupApp, UserModel } from "../utils/app.utils";
import { DEFAULT_CONFIRMATION_LINK_EXPIRATION_MS } from "passauth/auth/constants";
import { z } from "zod";

describe("Register with email-plugin", () => {
  let app: Express;
  let sequelize: Sequelize;
  let emailClient: EmailClient;

  beforeAll(async () => {
    const {
      app: appInstance,
      sequelize: sequelizeInstance,
      emailClient: emailClientInstance,
    } = await setupApp(true);

    app = appInstance;
    sequelize = sequelizeInstance;
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
        "Registration successful",
      );

      expect(emailSpy).toHaveBeenCalled();
      expect(emailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringMatching(
            /Confirm your email test@example.com by clicking on the following link: http:\/\/passauth-express.com\/confirm-email\?email=test@example.com&token=[\w-]+/,
          ),
        }),
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
        /token=([\w-]+)/,
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
        "Confirmation email sent",
      );
      expect(emailSpy).toHaveBeenCalled();
      expect(emailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringMatching(
            /Confirm your email test@example.com by clicking on the following link: http:\/\/passauth-express.com\/confirm-email\?email=test@example.com&token=[\w-]+/,
          ),
        }),
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
        /token=([\w-]+)/,
      )[1];

      await request(app)
        .get("/auth/register/send-email")
        .query({
          email: "test@example.com",
        })
        .expect(200);

      const sendEmailToken = (emailSpy.mock.calls[1][0] as any).text.match(
        /token=([\w-]+)/,
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
        /token=([\w-]+)/,
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

  describe("Hooks", () => {
    test("Should replace default register/send-email validation via beforeHandler", async () => {
      const {
        app: appInstance,
        emailClient: emailClientInstance,
      } = await setupApp(true, {
        hooks: {
          beforeHandler: {
            registerSendEmail(req) {
              const schema = z.object({
                mail: z.email(),
              });

              const data = schema.parse(req.query);

              return {
                email: data.mail,
              };
            },
          },
        },
      });
      const emailSpy = jest.spyOn(emailClientInstance, "send");

      const response = await request(appInstance)
        .get("/auth/register/send-email")
        .query({
          mail: "hook-mail@example.com",
        })
        .expect(200);

      expect(response.body).toEqual({
        message: "Confirmation email sent",
      });
      expect(emailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining("hook-mail@example.com"),
        }),
      );
    });

    test("Should replace default register/send-email response via afterHandler", async () => {
      const { app: appInstance } = await setupApp(true, {
        hooks: {
          afterHandler: {
            registerSendEmail({ data, result }) {
              return {
                delivered: result.success,
                target: data.email,
              };
            },
          },
        },
      });

      const response = await request(appInstance)
        .get("/auth/register/send-email")
        .query({
          email: "hook-after@example.com",
        })
        .expect(200);

      expect(response.body).toEqual({
        delivered: true,
        target: "hook-after@example.com",
      });
    });
  });
});

describe("Register without email-plugin", () => {
  let app: Express;
  let sequelize: Sequelize;

  beforeAll(async () => {
    const { app: appInstance, sequelize: sequelizeInstance } = await setupApp();

    app = appInstance;
    sequelize = sequelizeInstance;
  });

  describe("Route /auth/register", () => {
    beforeEach(async () => {
      await sequelize.truncate({ cascade: true });
      jest.clearAllMocks();
    });

    test("Should register user successfully", async () => {
      const response = await request(app).post("/auth/register").send({
        email: "test@example.com",
        password: "password",
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty(
        "message",
        "Registration successful",
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

    test("Should replace default register response via afterHandler", async () => {
      const { app: appInstance } = await setupApp(false, {
        hooks: {
          afterHandler: {
            register({ result }) {
              return {
                id: result.id,
                email: result.email,
              };
            },
          },
        },
      });

      const response = await request(appInstance)
        .post("/auth/register")
        .send({
          email: "after-register@example.com",
          password: "password",
        })
        .expect(201);

      expect(response.body).toEqual({
        id: expect.any(Number),
        email: "after-register@example.com",
      });
    });
  });
});
