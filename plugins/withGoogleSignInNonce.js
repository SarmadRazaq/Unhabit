/**
 * Expo config plugin: patches RNGoogleSignin.mm to forward a developer-supplied
 * nonce to GIDSignIn's nonce-aware API.
 *
 * GIDSignIn iOS SDK v7+ auto-embeds a nonce in every ID token. If we don't
 * supply the matching raw nonce to Supabase's signInWithIdToken, it rejects
 * with "Passed nonce and nonce in id_token should either both exist or not".
 *
 * The library (@react-native-google-signin/google-signin v16) does not expose
 * this in its JS API. This plugin patches the native signIn method to read an
 * optional `nonce` key from the options dict and call:
 *   signInWithPresentingViewController:nonce:hint:additionalScopes:completion:
 */
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withGoogleSignInNonce = (config) => {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const filePath = path.join(
        config.modRequest.projectRoot,
        'node_modules',
        '@react-native-google-signin',
        'google-signin',
        'ios',
        'RNGoogleSignin.mm'
      );

      let contents = fs.readFileSync(filePath, 'utf8');

      const original =
        `      [GIDSignIn.sharedInstance signInWithPresentingViewController:presentingViewController hint:hint additionalScopes:scopes completion:^(GIDSignInResult * _Nullable signInResult, NSError * _Nullable error) {\n` +
        `        [self handleCompletion:signInResult withError:error withResolver:resolve withRejector:reject fromCallsite:@"signIn"];\n` +
        `      }];`;

      const patched =
        `      NSString* nonce = options[@"nonce"];\n` +
        `      if (nonce != nil) {\n` +
        `        [GIDSignIn.sharedInstance signInWithPresentingViewController:presentingViewController nonce:nonce hint:hint additionalScopes:scopes completion:^(GIDSignInResult * _Nullable signInResult, NSError * _Nullable error) {\n` +
        `          [self handleCompletion:signInResult withError:error withResolver:resolve withRejector:reject fromCallsite:@"signIn"];\n` +
        `        }];\n` +
        `      } else {\n` +
        `        [GIDSignIn.sharedInstance signInWithPresentingViewController:presentingViewController hint:hint additionalScopes:scopes completion:^(GIDSignInResult * _Nullable signInResult, NSError * _Nullable error) {\n` +
        `          [self handleCompletion:signInResult withError:error withResolver:resolve withRejector:reject fromCallsite:@"signIn"];\n` +
        `        }];\n` +
        `      }`;

      if (contents.includes(patched)) {
        // Already patched — nothing to do
        return config;
      }

      if (!contents.includes(original)) {
        throw new Error(
          '[withGoogleSignInNonce] Could not find the target signIn block in RNGoogleSignin.mm. ' +
          'The library may have been updated — please review the plugin.'
        );
      }

      contents = contents.replace(original, patched);
      fs.writeFileSync(filePath, contents, 'utf8');
      console.log('[withGoogleSignInNonce] Successfully patched RNGoogleSignin.mm');

      return config;
    },
  ]);
};

module.exports = withGoogleSignInNonce;
