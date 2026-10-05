import {readFileSync,writeFileSync,mkdirSync,copyFileSync,renameSync,rmSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {dirname,resolve,join} from 'node:path';
import {parseArgs} from 'node:util';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const release=resolve(root,'releases/r163'),manifest=JSON.parse(readFileSync(join(release,'manifest.json'),'utf8'));
const {values}=parseArgs({options:{'artifact-dir':{type:'string'},check:{type:'boolean'}}});
const artifactDirectory=values['artifact-dir']||process.env.SONOLUS_ACCEPTED_ARTIFACT_DIR;
if(!artifactDirectory)throw new Error('Provide --artifact-dir or SONOLUS_ACCEPTED_ARTIFACT_DIR for the approved external CAS cache');
const artifactRoot=resolve(artifactDirectory);
const hash=(bytes,kind='sha256')=>createHash(kind).update(bytes).digest('hex');
const inGit=existsSync(join(root,'.git'));
// Read committed source when Git is available; uncommitted experiments cannot enter release bytes.
for(const [path,expected]of Object.entries(manifest.sourceFiles)){
 const bytes=inGit
  ?execFileSync('git',['show','HEAD:'+path],{cwd:root,maxBuffer:64*1024*1024,stdio:['ignore','pipe','pipe']})
  :readFileSync(join(root,path));
 if(hash(bytes)!==expected)throw new Error('Accepted source differs: '+path);
}
const verifiedArtifacts=new Map();
for(const spec of Object.values(manifest.artifacts)){
 const bytes=readFileSync(join(artifactRoot,spec.sha1));
 if(bytes.length!==spec.bytes||hash(bytes)!==spec.sha256||hash(bytes,'sha1')!==spec.sha1)throw new Error('Accepted CAS differs: '+spec.output);
 verifiedArtifacts.set(spec.output,bytes);
}
if(values.check){console.log('Accepted source and five release CAS verified');process.exit(0);}
const target=resolve(root,process.env.SONOLUS_ACCEPTED_DIST||'dist');
const staging=target+'.accepted-'+process.pid,backup=target+'.previous-'+process.pid;
mkdirSync(staging,{recursive:true});let backedUp=false,installed=false;
try{
 for(const [output,bytes]of verifiedArtifacts)writeFileSync(join(staging,output),bytes);
 writeFileSync(join(staging,'accepted-release.json'),JSON.stringify(manifest,null,2)+'\n');
 for(const file of ['LICENSE','NOTICE.txt','LICENSE.pjsekai.txt','LICENSE.sonolus-compiler.txt'])copyFileSync(join(root,file),join(staging,file));
 const revision=inGit?execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim():process.env.SONOLUS_ENGINE_REVISION?.trim();
 const sourceUrl=revision&&/^[0-9a-f]{40}$/i.test(revision)
  ?'https://github.com/haneoka-gakuen/sonolus-our-notes/tree/'+revision
  :'https://github.com/haneoka-gakuen/sonolus-our-notes';
 writeFileSync(join(staging,'SOURCE.txt'),'Corresponding Haneoka Source Code Form:\n'+sourceUrl+'\n');
 if(existsSync(target)){renameSync(target,backup);backedUp=true;}
 renameSync(staging,target);installed=true;
 if(backedUp)rmSync(backup,{recursive:true,force:true});
 console.log('Installed human-accepted r163 engine release');
}catch(error){if(backedUp&&!installed)renameSync(backup,target);throw error;}
finally{rmSync(staging,{recursive:true,force:true});}
