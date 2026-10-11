import {mkdirSync,cpSync,readdirSync,rmSync} from 'node:fs';
mkdirSync('public/studio',{recursive:true});
for(const file of readdirSync('public/studio'))rmSync('public/studio/'+file,{recursive:true,force:true});
for(const file of readdirSync('studio')){
  cpSync('studio/'+file,'public/studio/'+file,{recursive:true});
}
console.log('Assessment assets synchronized.');
