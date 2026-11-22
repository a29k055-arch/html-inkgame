import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const owned=ref=>execFileSync('git',['rev-list','-1',ref,'--','src-v5','v5.html'],{encoding:'utf8'}).trim();
assert(owned('5938e49').startsWith('9bf1464'),'R8 preview-only updates must retain the last validated V5 game snapshot');
assert(owned('6d32f95').startsWith('82fc2dd'),'R7 preview-only updates also leave the earlier V5 snapshot intact');
const current=owned('HEAD');assert.equal(owned(current),current);for(const path of ['src-v5','v5.html'])assert.equal(execFileSync('git',['rev-parse','HEAD:'+path],{encoding:'utf8'}).trim(),execFileSync('git',['rev-parse',current+':'+path],{encoding:'utf8'}).trim());
console.log('PASS preview-only history cannot silently advance the owned V5 game snapshot');
