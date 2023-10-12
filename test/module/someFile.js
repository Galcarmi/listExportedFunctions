import { add3 } from './someAnotherFile.js';
export { add4 } from './someAnotherFile.js';
export * from './someAnotherFile2.js';
export const add1 = (a, b) => a + b;

const add2 = (a, b) => a + b;

const add0 = (a, b) => a + b;
export { add2, add3 };
export default (a, b) => a + b;