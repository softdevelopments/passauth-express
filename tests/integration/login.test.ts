import {
  jest,
  describe,
  expect,
  beforeAll,
  beforeEach,
  test,
  afterAll,
} from "@jest/globals";
import request from "supertest";
import { Express } from "express";
import { Sequelize } from "sequelize";
import { hash } from "passauth/auth/utils";
import { DEFAULT_JWT_EXPIRATION_MS, DEFAULT_SALTING_ROUNDS } from "passauth";
import { z } from "zod";
import { setupApp, UserModel, UserRoleModel } from "../utils/app.utils";

const createAdminUser = async () => {
  const user = await UserModel.create({
    email: "admin@example.com",
    password: await hash("admin-password", DEFAULT_SALTING_ROUNDS),
    emailVerified: true,
  });

  await UserRoleModel.create({
    userId: user.id,
    role: "admin",
  });
};

describe("Login with email-plugin", () => {
  let app: Express;
  let sequelize: Sequelize;

  beforeAll(async () => {
    const { app: appInstance, sequelize: sequelizeInstance } =
      await setupApp(true);

    app = appInstance;
    sequelize = sequelizeInstance;
  });

  const registerAndConfirmUser = async (email: string, password: string) => {
    await request(app).post("/auth/register").send({
      email,
      password,
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
      jest.clearAllTimers();

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

    test("Should be able to refresh token", async () => {
      const loginResponse = await request(app)
        .post("/auth/login")
        .send({
          email: "test@example.com",
          password: "password",
        })
        .expect(200);

      const refreshResponse = await request(app)
        .post("/auth/refresh-token")
        .send({
          accessToken: loginResponse.body.accessToken,
          refreshToken: loginResponse.body.refreshToken,
        })
        .expect(200);

      expect(refreshResponse.body).toHaveProperty("accessToken");
      expect(refreshResponse.body).toHaveProperty("refreshToken");

      await request(app)
        .get("/is-logged")
        .set("Authorization", `Bearer ${refreshResponse.body.accessToken}`)
        .expect(200);
    });

    test("Should be able to refresh expired access token", async () => {
      jest.useFakeTimers();

      const loginResponse = await request(app)
        .post("/auth/login")
        .send({
          email: "test@example.com",
          password: "password",
        })
        .expect(200);

      jest.advanceTimersByTime(DEFAULT_JWT_EXPIRATION_MS + 1000);

      await request(app)
        .get("/is-logged")
        .set("Authorization", `Bearer ${loginResponse.body.accessToken}`)
        .expect(401);

      const refreshResponse = await request(app)
        .post("/auth/refresh-token")
        .send({
          accessToken: loginResponse.body.accessToken,
          refreshToken: loginResponse.body.refreshToken,
        })
        .expect(200);

      await request(app)
        .get("/is-logged")
        .set("Authorization", `Bearer ${refreshResponse.body.accessToken}`)
        .expect(200);

      expect(refreshResponse.body).toHaveProperty("accessToken");
      expect(refreshResponse.body).toHaveProperty("refreshToken");
    });

    test("Admin should be able to revoke refresh token", async () => {
      jest.useFakeTimers();

      await createAdminUser();

      const loginResponse = await request(app)
        .post("/auth/login")
        .send({
          email: "test@example.com",
          password: "password",
        })
        .expect(200);

      await request(app)
        .get("/is-logged")
        .set("Authorization", `Bearer ${loginResponse.body.accessToken}`)
        .expect(200);

      jest.advanceTimersByTime(DEFAULT_JWT_EXPIRATION_MS + 1000);

      await request(app)
        .get("/is-logged")
        .set("Authorization", `Bearer ${loginResponse.body.accessToken}`)
        .expect(401);

      const adminResponse = await request(app)
        .post("/auth/login")
        .send({
          email: "admin@example.com",
          password: "admin-password",
        })
        .expect(200);

      await request(app)
        .post("/auth/refresh-token/revoke")
        .set("Authorization", `Bearer ${adminResponse.body.accessToken}`)
        .send({
          email: "test@example.com",
        })
        .expect(200);

      await request(app)
        .post("/auth/refresh-token")
        .send({
          accessToken: loginResponse.body.accessToken,
          refreshToken: loginResponse.body.refreshToken,
        })
        .expect(400);
    });
  });
});

describe("Login without email-plugin", () => {
  let app: Express;
  let sequelize: Sequelize;

  beforeAll(async () => {
    const { app: appInstance, sequelize: sequelizeInstance } = await setupApp();

    app = appInstance;
    sequelize = sequelizeInstance;
  });

  const registerUser = async (
    email: string,
    password: string,
    roles?: string[]
  ) => {
    await request(app)
      .post("/auth/register")
      .send({
        email,
        password,
      })
      .expect(201);

    if (roles) {
      const user = await UserModel.findOne({
        where: {
          email,
        },
      });

      for (const role of roles) {
        await UserRoleModel.create({
          userId: user?.id,
          role,
        });
      }
    }
  };

  describe("Route /auth/login", () => {
    beforeEach(async () => {
      await sequelize.truncate({ cascade: true });
      jest.clearAllMocks();
      jest.clearAllTimers();

      await registerUser("test@example.com", "password");
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

    test("Should be able to refresh token", async () => {
      const loginResponse = await request(app)
        .post("/auth/login")
        .send({
          email: "test@example.com",
          password: "password",
        })
        .expect(200);

      const refreshResponse = await request(app)
        .post("/auth/refresh-token")
        .send({
          accessToken: loginResponse.body.accessToken,
          refreshToken: loginResponse.body.refreshToken,
        })
        .expect(200);

      expect(refreshResponse.body).toHaveProperty("accessToken");
      expect(refreshResponse.body).toHaveProperty("refreshToken");

      await request(app)
        .get("/is-logged")
        .set("Authorization", `Bearer ${refreshResponse.body.accessToken}`)
        .expect(200);
    });

    test("Should be able to refresh expired access token", async () => {
      jest.useFakeTimers();

      const loginResponse = await request(app)
        .post("/auth/login")
        .send({
          email: "test@example.com",
          password: "password",
        })
        .expect(200);

      jest.advanceTimersByTime(DEFAULT_JWT_EXPIRATION_MS + 1000);

      await request(app)
        .get("/is-logged")
        .set("Authorization", `Bearer ${loginResponse.body.accessToken}`)
        .expect(401);

      const refreshResponse = await request(app)
        .post("/auth/refresh-token")
        .send({
          accessToken: loginResponse.body.accessToken,
          refreshToken: loginResponse.body.refreshToken,
        })
        .expect(200);

      await request(app)
        .get("/is-logged")
        .set("Authorization", `Bearer ${refreshResponse.body.accessToken}`)
        .expect(200);

      expect(refreshResponse.body).toHaveProperty("accessToken");
      expect(refreshResponse.body).toHaveProperty("refreshToken");
    });

    test("Admin should be able to revoke refresh token", async () => {
      jest.useFakeTimers();

      await createAdminUser();

      const loginResponse = await request(app)
        .post("/auth/login")
        .send({
          email: "test@example.com",
          password: "password",
        })
        .expect(200);

      await request(app)
        .get("/is-logged")
        .set("Authorization", `Bearer ${loginResponse.body.accessToken}`)
        .expect(200);

      jest.advanceTimersByTime(DEFAULT_JWT_EXPIRATION_MS + 1000);

      await request(app)
        .get("/is-logged")
        .set("Authorization", `Bearer ${loginResponse.body.accessToken}`)
        .expect(401);

      const adminResponse = await request(app)
        .post("/auth/login")
        .send({
          email: "admin@example.com",
          password: "admin-password",
        })
        .expect(200);

      await request(app)
        .post("/auth/refresh-token/revoke")
        .set("Authorization", `Bearer ${adminResponse.body.accessToken}`)
        .send({
          email: "test@example.com",
        })
        .expect(200);

      await request(app)
        .post("/auth/refresh-token")
        .send({
          accessToken: loginResponse.body.accessToken,
          refreshToken: loginResponse.body.refreshToken,
        })
        .expect(400);
    });
  });

  describe("Hooks", () => {
    const registerUser = async (
      app: Express,
      data: {
        email: string;
        password: string;
        roles?: string[];
      }
    ) => {
      await request(app)
        .post("/auth/register")
        .send({
          email: data.email,
          password: data.password,
        })
        .expect(201);

      if (data.roles) {
        const user = await UserModel.findOne({
          where: {
            email: data.email,
          },
        });

        for (const role of data.roles) {
          await UserRoleModel.create({
            userId: user?.id,
            role,
          });
        }
      }
    };

    describe("afterLogin", () => {
      test("Should be able to inject login response", async () => {
        const { app: appInstance } = await setupApp(false, {
          hooks: {
            async afterLogin(_data) {
              return {
                role: "super-admin",
                nickname: "Johndoedoe",
              };
            },
          },
        });

        await registerUser(appInstance, {
          email: "test@example.com",
          password: "password",
        });

        const response = await request(appInstance)
          .post("/auth/login")
          .send({
            email: "test@example.com",
            password: "password",
          })
          .expect(200);

        expect(response.body).toHaveProperty("accessToken");
        expect(response.body).toHaveProperty("refreshToken");
        expect(response.body).toEqual(
          expect.objectContaining({
            accessToken: expect.any(String),
            refreshToken: expect.any(String),
            role: "super-admin",
            nickname: "Johndoedoe",
          })
        );
      });
    });

    describe("beforeHandler", () => {
      test("Should replace default register/login validation when custom route hooks are provided", async () => {
        const { app: appInstance } = await setupApp(false, {
          hooks: {
            beforeHandler: {
              register(req) {
                const schema = z.object({
                  username: z.email(),
                  secret: z.string().min(6).max(100),
                  nickname: z.string().min(2),
                });

                const data = schema.parse(req.body);

                return {
                  email: data.username,
                  password: data.secret,
                  nickname: data.nickname,
                };
              },
              login(req) {
                const schema = z.object({
                  username: z.email(),
                  secret: z.string().min(6).max(100),
                });

                const data = schema.parse(req.body);

                return {
                  email: data.username,
                  password: data.secret,
                };
              },
            },
          },
        });

        await request(appInstance)
          .post("/auth/register")
          .send({
            username: "custom-shape@example.com",
            secret: "password",
            nickname: "john",
          })
          .expect(201);

        const response = await request(appInstance)
          .post("/auth/login")
          .send({
            username: "custom-shape@example.com",
            secret: "password",
          })
          .expect(200);

        expect(response.body).toHaveProperty("accessToken");
        expect(response.body).toHaveProperty("refreshToken");
      });
    });

    describe("afterHandler", () => {
      test("Should replace default login response when custom login afterHandler is provided", async () => {
        const { app: appInstance } = await setupApp(false, {
          hooks: {
            afterHandler: {
              login({ data, result }) {
                return {
                  token: result.accessToken,
                  userEmail: data.email,
                };
              },
            },
          },
        });

        await registerUser(appInstance, {
          email: "after-handler@example.com",
          password: "password",
        });

        const response = await request(appInstance)
          .post("/auth/login")
          .send({
            email: "after-handler@example.com",
            password: "password",
          })
          .expect(200);

        expect(response.body).toEqual(
          expect.objectContaining({
            token: expect.any(String),
            userEmail: "after-handler@example.com",
          }),
        );
        expect(response.body).not.toHaveProperty("refreshToken");
      });

      test("Should prioritize login afterHandler over afterLogin hook", async () => {
        const { app: appInstance } = await setupApp(false, {
          hooks: {
            async afterLogin() {
              return {
                role: "should-not-be-returned",
              };
            },
            afterHandler: {
              login({ result }) {
                return {
                  token: result.accessToken,
                };
              },
            },
          },
        });

        await registerUser(appInstance, {
          email: "after-handler-priority@example.com",
          password: "password",
        });

        const response = await request(appInstance)
          .post("/auth/login")
          .send({
            email: "after-handler-priority@example.com",
            password: "password",
          })
          .expect(200);

        expect(response.body).toEqual({
          token: expect.any(String),
        });
      });
    });
  });

  describe("Middlewares", () => {
    describe("Role Guard", () => {
      test("Should allow only user with correct role to acesss protected route", async () => {
        // Profile 1
        await registerUser("profile-1@email.com", "password123", ["profile-1"]);

        const loginProfile1 = await request(app)
          .post("/auth/login")
          .send({
            email: "profile-1@email.com",
            password: "password123",
          })
          .expect(200);

        await request(app)
          .get("/profile-1")
          .set("Authorization", `Bearer ${loginProfile1.body.accessToken}`)
          .expect(200);
        await request(app)
          .get("/profile-2")
          .set("Authorization", `Bearer ${loginProfile1.body.accessToken}`)
          .expect(403);

        // Profile 2
        await registerUser("profile-2@email.com", "password456", ["profile-2"]);

        const loginProfile2 = await request(app)
          .post("/auth/login")
          .send({
            email: "profile-2@email.com",
            password: "password456",
          })
          .expect(200);

        await request(app)
          .get("/profile-1")
          .set("Authorization", `Bearer ${loginProfile2.body.accessToken}`)
          .expect(403);
        await request(app)
          .get("/profile-2")
          .set("Authorization", `Bearer ${loginProfile2.body.accessToken}`)
          .expect(200);
      });
    });
  });
});
