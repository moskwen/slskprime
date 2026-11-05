import { wishlistTick, wishIsDue } from './wishlist';
import { getWishes, saveWish, setWishInterval, updateWish } from './studio';

const time = Date.parse('2026-11-05T12:00:00Z');
const fixture = (overrides={}) => ({api:{create:jest.fn().mockResolvedValue({}),getStatus:jest.fn().mockResolvedValue({isComplete:true,fileCount:4})},
  makeId:jest.fn().mockReturnValueOnce('claim').mockReturnValue('search'),owner:'tab',now:()=>time,settle:async()=>{},...overrides});
beforeEach(()=>localStorage.clear());
test('manual wishes never run automatically, and recent runs wait for the interval',()=>{
  expect(wishIsDue({query:'rare'} ,time)).toBe(false);
  expect(wishIsDue({intervalMinutes:30,lastRunAt:new Date(time-29*60000).toISOString()},time)).toBe(false);
  expect(wishIsDue({intervalMinutes:30,lastRunAt:new Date(time-30*60000).toISOString()},time)).toBe(true);
});
test('due wishes run once and remain pending; another tab cannot duplicate them',async()=>{
  saveWish('Rare record');setWishInterval('Rare record',30);
  const args=fixture();await wishlistTick(args);
  expect(args.api.create).toHaveBeenCalledWith({id:'search',searchText:'Rare record',timeout:20000});
  expect(getWishes()[0].pendingSearchId).toBe('search');
  await wishlistTick(args);
  expect(args.api.create).toHaveBeenCalledTimes(1);
  expect(getWishes()[0].resultCount).toBe(4);
});
test('failed requests back off instead of looping on reload',async()=>{
  saveWish('Rare');setWishInterval('Rare',60);
  const args=fixture();args.api.create.mockRejectedValue(new Error('offline'));
  await wishlistTick(args);await wishlistTick(args);
  expect(args.api.create).toHaveBeenCalledTimes(1);expect(getWishes()[0].lastError).toMatch(/60 minutes/);
});
test('a different active lease and unmounted workers do not send searches',async()=>{
  saveWish('Rare');setWishInterval('Rare',30);
  localStorage.setItem('slskprime-wishlist-lease-v1',JSON.stringify({claim:'other',expires:time+1000}));
  const args=fixture();await wishlistTick(args);expect(args.api.create).not.toHaveBeenCalled();
  localStorage.removeItem('slskprime-wishlist-lease-v1');await wishlistTick({...args,active:()=>false});expect(args.api.create).not.toHaveBeenCalled();
});
test('simultaneous tabs settle on one lease before creating a search',async()=>{
  saveWish('Rare');setWishInterval('Rare',30);
  const resolve=[];const settle=()=>new Promise(done=>resolve.push(done));
  const a=fixture({owner:'a',settle}),b=fixture({owner:'b'});
  const first=wishlistTick(a);await wishlistTick(b);resolve[0]();await first;
  expect(a.api.create.mock.calls.length+b.api.create.mock.calls.length).toBe(1);
});
test('completion alerts fire once, and pending checks rotate across queries',async()=>{
  saveWish('First');saveWish('Second');
  updateWish('First',{pendingSearchId:'1',statusCheckedAt:new Date(time-100).toISOString()});
  updateWish('Second',{pendingSearchId:'2'});
  const args=fixture({notify:jest.fn()});await wishlistTick(args);await wishlistTick(args);await wishlistTick(args);
  expect(args.api.getStatus.mock.calls).toEqual([[{id:'2',timeout:20000}],[{id:'1',timeout:20000}]]);expect(args.notify).toHaveBeenCalledTimes(2);
});
