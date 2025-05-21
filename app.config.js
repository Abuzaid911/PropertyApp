export default {
  expo: {
    name: "PropertyManagementApp",
    slug: "PropertyManagementApp",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    scheme: "propertymanagement",
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.example.propertymanagementapp",
      config: {
        usesNonExemptEncryption: false
      },
      infoPlist: {
        LSApplicationQueriesSchemes: [
          "uaepass",
          "uaepassstg"
        ]
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.example.propertymanagementapp",
      intentFilters: [
        {
          action: "VIEW",
          category: ["DEFAULT", "BROWSABLE"],
          data: {
            scheme: "propertymanagement"
          }
        }
      ],
      queries: {
        packageInstalls: [
          "ae.uaepass.mainapp",
          "ae.uaepass.mainapp.stg"
        ]
      }
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-secure-store",
      "expo-web-browser"
    ],
    extra: {
      uaePass: {
        clientId: process.env.UAE_PASS_CLIENT_ID || "sandbox_stage",
        clientSecret: process.env.UAE_PASS_CLIENT_SECRET || "sandbox_stage_secret",
        redirectUri: "propertymanagement://callback",
        authorizationUrl: "https://stg-id.uaepass.ae/idshub/authorize",
        tokenUrl: "https://stg-id.uaepass.ae/idshub/token",
        userInfoUrl: "https://stg-id.uaepass.ae/idshub/userinfo",
        logoutUrl: "https://stg-id.uaepass.ae/idshub/logout"
      },
      eas: {
        projectId: "your-project-id"
      }
    }
  }
}; 