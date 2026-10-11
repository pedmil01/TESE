import {mkdirSync,cpSync,readdirSync,rmSync} from 'node:fs';
mkdirSync('public/studio',{recursive:true});
for(const file of readdirSync('public/studio'))rmSync('public/studio/'+file,{recursive:true,force:true});
for(const file of readdirSync('dist')){
  if(['server','client'].includes(file))continue;
  cpSync('dist/'+file,'public/studio/'+file,{recursive:true});
}
console.log('Assessment assets synchronized.');
