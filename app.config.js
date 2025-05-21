import "dotenv/config";

export default {
  expo: {
    name: "Property Management App",
    slug: "property-management-app",
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
    updates: {
      url: "https://u.expo.dev/bb665593-48c8-4113-a06a-8a5618e2680b",
      fallbackToCacheTimeout: 0
    },
    runtimeVersion: {
      policy: "appVersion"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.yourcompany.propertymanagement",
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
        backgroundColor: "#FFFFFF"
      },
      package: "com.yourcompany.propertymanagement",
      permissions: [
        "INTERNET"
      ],
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "propertymanagement"
            }
          ],
          category: ["BROWSABLE", "DEFAULT"]
        }
      ]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-secure-store",
      "expo-web-browser",
      "expo-updates",
      [
        "expo-build-properties",
        {
          "android": {
            "compileSdkVersion": 33,
            "targetSdkVersion": 33,
            "buildToolsVersion": "33.0.0"
          },
          "ios": {
            "deploymentTarget": "15.1"
          }
        }
      ]
    ],
    extra: {
      uaePass: {
        clientId: "sandbox_stage",
        clientSecret: "sandbox_stage_secret",
        redirectUri: process.env.NGROK_URL ? `${process.env.NGROK_URL}/auth/callback` : "propertymanagement://callback",
        authorizationUrl: "https://stg-id.uaepass.ae/idshub/authorize",
        tokenUrl: "https://stg-id.uaepass.ae/idshub/token",
        userInfoUrl: "https://stg-id.uaepass.ae/idshub/userinfo",
        logoutUrl: "https://stg-id.uaepass.ae/idshub/logout",
        isDev: true,
      },
      eas: {
        projectId: "bb665593-48c8-4113-a06a-8a5618e2680b"
      }
    }
  }
}; 