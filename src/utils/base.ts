import moment from "moment";


// 判断当前时间是否在本周内
export const isInCurrentWeek = (timestamp: number, weekStart = 1) => {
  const t = moment(timestamp);
  const today = moment();
  return t.isSame(today, 'week');
}