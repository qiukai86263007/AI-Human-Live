/*
 * @Author: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @Date: 2025-03-07 09:25:38
 * @LastEditors: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @LastEditTime: 2025-03-07 10:33:41
 * @FilePath: \workRome\AI-Human-Live\src\types\liveRoomState.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
// LiveRoomState.EDITING | LiveRoomState.CREATED | 'running' | 'live';
export enum LiveRoomState {
    EDITING = 'editing',    // 编辑中
    CREATED = 'created',    // 待开播
    CREATING = 'creating',  // 渲染中
    RUNNING = 'running',        // 现在好像有一部分的running和creating是搞混了  仔细分别一下 
            /*
                目前看来 是逻辑有错误 比如说通过LiveRoomState.CREATED || state === LiveRoomState.RUNNING; 来判断一些禁用逻辑
                先不弄了 下次搜索LiveRoomState.RUNNING就可以了
            */
    STOPPED = 'stopped',
    LIVE = 'live',      // 直播中
    DESTROYED = 'destroyed',
    FAIL = 'fail',
    ERROR = 'error',
    UNKNOWN = 'unknown',
    WAITING = 'waiting',
    RECONNECTING = 'reconnecting',
    RECONNECTED = 'reconnected',
    RECONNECT_FAIL = 'reconnect_fail',
}
  
