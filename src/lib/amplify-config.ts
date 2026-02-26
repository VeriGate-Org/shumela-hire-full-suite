import { Amplify } from 'aws-amplify';

const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
const userPoolClientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
const cognitoDomain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const isCognitoConfigured = !!(userPoolId && userPoolClientId);
export const isOAuthConfigured = !!(isCognitoConfigured && cognitoDomain);

export function configureAmplify() {
  if (!isCognitoConfigured) {
    return;
  }

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: userPoolId!,
        userPoolClientId: userPoolClientId!,
        loginWith: {
          email: true,
          ...(cognitoDomain && {
            oauth: {
              domain: cognitoDomain,
              scopes: ['openid', 'email', 'profile'],
              redirectSignIn: [appUrl + '/login'],
              redirectSignOut: [appUrl + '/login'],
              responseType: 'code' as const,
              providers: [{ custom: 'LinkedIn' }],
            },
          }),
        },
      },
    },
  });
}
