import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,renameSync,rmSync,existsSync,realpathSync,lstatSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {dirname,resolve,join,relative,basename,isAbsolute,sep} from 'node:path';
import {parseArgs} from 'node:util';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const inGit=existsSync(join(root,'.git'));
const revision=inGit?execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim():process.env.SONOLUS_ENGINE_REVISION?.trim();
const sourceBytes=path=>inGit
 ?execFileSync('git',['show',revision+':'+path],{cwd:root,maxBuffer:64*1024*1024,stdio:['ignore','pipe','pipe']})
 :readFileSync(join(root,path));
const manifest=JSON.parse(sourceBytes('releases/r163/manifest.json'));
const {values}=parseArgs({options:{'artifact-dir':{type:'string'},check:{type:'boolean'}}});
const artifactDirectory=values['artifact-dir']||process.env.SONOLUS_ACCEPTED_ARTIFACT_DIR;
if(!artifactDirectory)throw new Error('Provide --artifact-dir or SONOLUS_ACCEPTED_ARTIFACT_DIR for the approved external CAS cache');
const artifactRoot=resolve(artifactDirectory);
const hash=(bytes,kind='sha256')=>createHash(kind).update(bytes).digest('hex');
const target=resolve(root,process.env.SONOLUS_ACCEPTED_DIST||'dist');
const contains=(parent,path)=>{const tail=relative(parent,path);return !tail||(!isAbsolute(tail)&&tail!=='..'&&!tail.startsWith('..'+sep));};
const overlaps=(a,b)=>contains(a,b)||contains(b,a);
// Resolve aliases even when the final output directory does not exist yet.
const canonical=path=>{
 const suffix=[];let current=path;
 while(true){
  try{return resolve(realpathSync(current),...suffix);}
  catch(error){
   if(error.code!=='ENOENT'||lstatSync(current,{throwIfNoEntry:false})?.isSymbolicLink())throw error;
   const parent=dirname(current);if(parent===current)throw error;
   suffix.unshift(basename(current));current=parent;
  }
 }
};
const actualRoot=canonical(root),actualTarget=canonical(target),actualArtifacts=canonical(artifactRoot);
const rejectTarget=()=>{throw new Error('Unsafe accepted distribution target: '+target);};
const existingTarget=lstatSync(target,{throwIfNoEntry:false});
if(existingTarget&&!existingTarget.isDirectory())rejectTarget();
if(contains(target,root)||contains(actualTarget,actualRoot))rejectTarget();
// Only dist and its children are distribution locations inside the checkout.
if(contains(root,target)&&!contains(join(root,'dist'),target))rejectTarget();
if(contains(actualRoot,actualTarget)&&!contains(join(actualRoot,'dist'),actualTarget))rejectTarget();
if(overlaps(target,artifactRoot)||overlaps(actualTarget,actualArtifacts))rejectTarget();
const protectedPaths=['play','watch','preview','tutorial','shared','scripts','releases','.git','package.json','LICENSE','NOTICE.txt','LICENSE.pjsekai.txt','LICENSE.sonolus-compiler.txt',...Object.keys(manifest.sourceFiles)].map(path=>join(root,path));
if(inGit)for(const flag of ['--absolute-git-dir','--git-common-dir'])protectedPaths.push(resolve(root,execFileSync('git',['rev-parse',flag],{cwd:root,encoding:'utf8'}).trim()));
for(const protectedPath of protectedPaths){
 if(overlaps(target,protectedPath)||overlaps(actualTarget,canonical(protectedPath)))rejectTarget();
}
// Bind source, manifest and licenses to one committed revision; archives use their files.
for(const [path,expected]of Object.entries(manifest.sourceFiles)){
 const bytes=sourceBytes(path);
 if(hash(bytes)!==expected)throw new Error('Accepted source differs: '+path);
}
const verifiedArtifacts=new Map();
for(const spec of Object.values(manifest.artifacts)){
 const bytes=readFileSync(join(artifactRoot,spec.sha1));
 if(bytes.length!==spec.bytes||hash(bytes)!==spec.sha256||hash(bytes,'sha1')!==spec.sha1)throw new Error('Accepted CAS differs: '+spec.output);
 verifiedArtifacts.set(spec.output,bytes);
}
if(values.check){console.log('Accepted source and five release CAS verified');process.exit(0);}
const licenses=new Map(['LICENSE','NOTICE.txt','LICENSE.pjsekai.txt','LICENSE.sonolus-compiler.txt'].map(file=>[file,sourceBytes(file)]));
mkdirSync(dirname(target),{recursive:true});
const workspace=mkdtempSync(join(dirname(target),'.sonolus-accepted-'));
const staging=join(workspace,'next'),backup=join(workspace,'previous');
mkdirSync(staging,{recursive:true});let backedUp=false,installed=false;
try{
 for(const [output,bytes]of verifiedArtifacts)writeFileSync(join(staging,output),bytes);
 writeFileSync(join(staging,'accepted-release.json'),JSON.stringify(manifest,null,2)+'\n');
 for(const [file,bytes]of licenses)writeFileSync(join(staging,file),bytes);
 const sourceUrl=revision&&/^[0-9a-f]{40}$/i.test(revision)
  ?'https://github.com/haneoka-gakuen/sonolus-our-notes/tree/'+revision
  :'https://github.com/haneoka-gakuen/sonolus-our-notes';
 writeFileSync(join(staging,'SOURCE.txt'),'Corresponding Haneoka Source Code Form:\n'+sourceUrl+'\n');
 if(existsSync(target)){renameSync(target,backup);backedUp=true;}
 renameSync(staging,target);installed=true;
 if(backedUp)rmSync(backup,{recursive:true,force:true});
 console.log('Installed human-accepted r163 engine release');
}catch(error){if(backedUp&&!installed)renameSync(backup,target);throw error;}
finally{rmSync(workspace,{recursive:true,force:true});}
