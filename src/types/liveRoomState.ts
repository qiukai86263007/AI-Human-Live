/*
 * @Author: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @Date: 2025-03-07 09:25:38
 * @LastEditors: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @LastEditTime: 2025-03-07 10:33:41
 * @FilePath: \workRome\AI-Human-Live\src\types\liveRoomState.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
// 之前有running状态 等同于现在的created
export enum LiveRoomState {
  EDITING = 'editing', // 编辑中
  CREATING = 'creating', // 渲染中
  CREATED = 'created', // 待开播
  LIVE = 'live', // 直播中
  STOPPED = 'stopped', // 已停播
  DESTROYED = 'destroyed',
  FAIL = 'fail',
  ERROR = 'error',
  UNKNOWN = 'unknown',
  WAITING = 'waiting',
  RECONNECTING = 'reconnecting',
  RECONNECTED = 'reconnected',
  RECONNECT_FAIL = 'reconnect_fail',
}
