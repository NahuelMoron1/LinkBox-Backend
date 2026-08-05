describe("config", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it("defaults to 3000 when PORT is not set", () => {
    delete process.env.PORT;
    const { PORT } = require("./config");
    expect(PORT).toBe("3000");
  });

  it("uses PORT from the environment when set", () => {
    process.env.PORT = "4321";
    const { PORT } = require("./config");
    expect(PORT).toBe("4321");
  });
});
