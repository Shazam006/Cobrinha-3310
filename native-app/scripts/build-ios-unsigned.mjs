import {spawnSync} from 'node:child_process';
import {mkdirSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const app=fileURLToPath(new URL('../',import.meta.url));
if(process.platform!=='darwin')throw Error('Run this script on macOS with Xcode.');
function run(command,args){const r=spawnSync(command,args,{cwd:app,stdio:'inherit'});if(r.error)throw r.error;if(r.status!==0)throw Error(`${command} failed (${r.status}).`)}
run('xcodebuild',['-project','ios/App/App.xcodeproj','-scheme','App','-configuration','Release','-sdk','iphoneos','-destination','generic/platform=iOS','-derivedDataPath','build/ios','CODE_SIGNING_ALLOWED=NO','CODE_SIGNING_REQUIRED=NO','CODE_SIGN_IDENTITY=','build']);
const product=app+'build/ios/Build/Products/Release-iphoneos/App.app';
if(!existsSync(product))throw Error('Xcode did not produce the app.');
mkdirSync(app+'build/package/Payload',{recursive:true});
run('ditto',[product,'build/package/Payload/Cobrinha 3310.app']);
run('ditto',['-c','-k','--keepParent','build/package/Payload','build/Cobrinha-3310-sem-assinatura.ipa']);
console.log('IPA generated. Sign and install it using Sideloadly and your own Apple account.');
