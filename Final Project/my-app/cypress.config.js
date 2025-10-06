const { defineConfig } = require("cypress");
const { devServer } = require("@cypress/webpack-dev-server");

module.exports = defineConfig({
  component: {
    devServer: (devServerConfig) => {
      return devServer({
        ...devServerConfig,
        webpackConfig: {
          resolve: {
            extensions: [".js", ".jsx", ".ts", ".tsx"],
          },
          module: {
            rules: [
              {
                test: /\.(js|jsx|ts|tsx)$/,
                exclude: /node_modules/,
                use: {
                  loader: "babel-loader",
                  options: {
                    presets: ["@babel/preset-env", "@babel/preset-react"],
                  },
                },
              },
            ],
          },
        },
      });
    },
    specPattern: "src/**/*.cy.{js,jsx,ts,tsx}",
  },
});
