import type { PalaceName, MansionName } from '../types';

export interface PalaceBoundary {
  name: PalaceName;
  startDeg: number;
  endDeg: number;
  mansions: MansionName[];
}

export const PALACE_BOUNDARIES: readonly PalaceBoundary[] = [
  { name: '辰宮', startDeg: 0,   endDeg: 30,  mansions: ['角', '亢'] },
  { name: '卯宮', startDeg: 30,  endDeg: 60,  mansions: ['氐', '房', '心'] },
  { name: '寅宮', startDeg: 60,  endDeg: 90,  mansions: ['尾', '箕'] },
  { name: '丑宮', startDeg: 90,  endDeg: 120, mansions: ['斗', '牛'] },
  { name: '子宮', startDeg: 120, endDeg: 150, mansions: ['女', '虛', '危'] },
  { name: '亥宮', startDeg: 150, endDeg: 180, mansions: ['室', '壁'] },
  { name: '戌宮', startDeg: 180, endDeg: 210, mansions: ['奎', '婁', '胃'] },
  { name: '酉宮', startDeg: 210, endDeg: 240, mansions: ['昴', '畢'] },
  { name: '申宮', startDeg: 240, endDeg: 270, mansions: ['觜', '參'] },
  { name: '未宮', startDeg: 270, endDeg: 300, mansions: ['井', '鬼'] },
  { name: '午宮', startDeg: 300, endDeg: 330, mansions: ['柳', '星', '張'] },
  { name: '巳宮', startDeg: 330, endDeg: 360, mansions: ['翼', '軫'] },
];
