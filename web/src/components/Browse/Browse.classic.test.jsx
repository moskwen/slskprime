import {Browse} from './Browse';
import * as users from '../../lib/users';
jest.mock('../../lib/users',()=>({browse:jest.fn()}));
const make=()=>{const b=new Browse({location:{state:{user:'one',directory:'Music/Album'}}});b.setState=(patch,done)=>{b.state={...b.state,...(typeof patch==='function'?patch(b.state):patch)};done?.();};b.inputtext={inputRef:{current:{value:''}}};b.saveState=jest.fn();b.saveTree=jest.fn();b.handleDirectoryNavigate=jest.fn();return b;};
test('opening a result selects its containing folder and restores another user without re-fetching',async()=>{
 const b=make();users.browse.mockResolvedValue({directories:[{name:'Music',fileCount:0,files:[]},{name:'Music/Album',fileCount:1,files:[{filename:'one.flac',size:100}]}],lockedDirectories:[]});
 await b.browse('one');expect(b.state.selected.directoryName).toBe('Music/Album');
 b.props={location:{state:{user:'two'}}};await b.browse('two');
 b.props={location:{state:{user:'one'}}};await b.browse('one');
 expect(users.browse).toHaveBeenCalledTimes(2);expect(b.state.selected.directoryName).toBe('Music/Album');expect(b.state.username).toBe('one');
});
