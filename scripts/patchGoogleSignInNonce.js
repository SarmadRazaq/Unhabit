/**
 * Patches RNGoogleSignin.mm to forward a developer-supplied nonce to
 * GIDSignIn's nonce-aware API:
 *   signInWithPresentingViewController:nonce:hint:additionalScopes:completion:
 *
 * GIDSignIn iOS SDK v7+ auto-embeds a nonce in every ID token. Without this
 * patch, we cannot provide the matching raw nonce to Supabase, causing:
 * "Passed nonce and nonce in id_token should either both exist or not"
 *
 * Runs as a postinstall npm script so it applies after every `npm ci`.
 */
const fs = require('fs');
const path = require('path');

const filePath = path.join(
  __dirname,
  '..',
  'node_modules',
  '@react-native-google-signin',
  'google-signin',
  'ios',
  'RNGoogleSignin.mm'
);

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

if (!fs.existsSync(filePath)) {
  console.warn('[patchGoogleSignInNonce] File not found — skipping:', filePath);
  process.exit(0);
}

let contents = fs.readFileSync(filePath, 'utf8');

if (contents.includes(patched)) {
  console.log('[patchGoogleSignInNonce] Already patched — skipping.');
  process.exit(0);
}

if (!contents.includes(original)) {
  console.error(
    '[patchGoogleSignInNonce] Target block not found in RNGoogleSignin.mm.\n' +
    'The library may have been updated — please review scripts/patchGoogleSignInNonce.js.'
  );
  process.exit(1);
}

contents = contents.replace(original, patched);
fs.writeFileSync(filePath, contents, 'utf8');
console.log('[patchGoogleSignInNonce] Successfully patched RNGoogleSignin.mm');
