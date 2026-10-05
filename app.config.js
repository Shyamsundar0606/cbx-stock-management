const { ensureApi } = require("./scripts/ensure-api.cjs");
module.exports = () => {
  if (
    process.env.STOCK_SKIP_API !== "1" &&
    process.argv.some(
      (arg) =>
        arg === "start" ||
        arg === "--web" ||
        arg === "--android" ||
        arg === "--ios",
    )
  )
    ensureApi();
  return {
    expo: {
      name: "CBX Stock",
      slug: "cbx-stock",
      version: "1.0.0",
      orientation: "portrait",
      userInterfaceStyle: "light",
      ios: { supportsTablet: true },
      android: { package: "com.cbx.stock", usesCleartextTraffic: true },
      web: { bundler: "metro", name: "CBX Stock" },
    },
  };
};
