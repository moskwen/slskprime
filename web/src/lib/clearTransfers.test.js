import {clearTransferRecords} from './clearTransfers';
const groups=files=>[{username:'peer',directories:[{directory:'album',files}]}];
test('clears only snapshot transfer records with bounded concurrency and keeps later downloads',async()=>{
  const records=Array.from({length:12},(_,i)=>({id:String(i),username:'peer'}));
  let concurrent=0,max=0;
  const api={cancel:jest.fn(async()=>{concurrent++;max=Math.max(max,concurrent);await Promise.resolve();concurrent--;}),getAll:jest.fn().mockResolvedValue(groups([{id:'new',state:'InProgress'}]))};
  const result=await clearTransferRecords({records,api,pause:async()=>{}});
  expect(max).toBeLessThanOrEqual(4);expect(api.cancel).toHaveBeenCalledTimes(12);
  expect(api.cancel).toHaveBeenCalledWith({direction:'download',username:'peer',id:'0',remove:true});
  expect(api.cancel.mock.calls.some(([arg])=>arg.id==='new')).toBe(false);
  expect(result).toMatchObject({cleared:12,remaining:0});expect(result.latest[0].directories[0].files[0].id).toBe('new');
});
test('rechecks cancellation before reporting success and reports unresolved records honestly',async()=>{
  const records=[{id:'one',username:'peer'}];
  const api={cancel:jest.fn().mockResolvedValue({}),getAll:jest.fn().mockResolvedValueOnce(groups([{id:'one',state:'InProgress'}])).mockResolvedValue([])};
  expect(await clearTransferRecords({records,api,pause:async()=>{}})).toMatchObject({cleared:1,remaining:0});
  expect(api.cancel).toHaveBeenCalledTimes(2);
  api.getAll.mockResolvedValue(groups([{id:'one',state:'InProgress'}]));
  expect(await clearTransferRecords({records,api,pause:async()=>{}})).toMatchObject({cleared:0,remaining:1});
});
test('an already missing record is success, but a failed refresh never reports a clean list',async()=>{
  const api={cancel:jest.fn().mockRejectedValue({response:{status:404}}),getAll:jest.fn().mockResolvedValue([])};
  const records=[{id:'gone',username:'peer'}];
  expect(await clearTransferRecords({records,api})).toMatchObject({cleared:1,remaining:0});
  api.getAll.mockRejectedValue(new Error('offline'));
  await expect(clearTransferRecords({records,api})).rejects.toThrow('offline');
});
