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
import { setupApp, UserModel } from "../utils/app.utils";

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

  const createAdminUser = async () => {
    await UserModel.create({
      email: "admin@example.com",
      password: await hash("admin-password", DEFAULT_SALTING_ROUNDS),
      role: "admin",
      emailVerified: true,
    });
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

  const registerAndConfirmUser = async (email: string, password: string) => {
    await request(app).post("/auth/register").send({
      email,
      password,
    });
  };

  const createAdminUser = async () => {
    await UserModel.create({
      email: "admin@example.com",
      password: await hash("admin-password", DEFAULT_SALTING_ROUNDS),
      role: "admin",
      emailVerified: true,
    });
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
