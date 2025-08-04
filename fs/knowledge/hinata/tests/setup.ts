/**
 * Jest 测试设置文件
 * 
 * 这个文件在所有测试运行之前执行，用于设置全局测试环境。
 */

// 设置测试超时时间
jest.setTimeout(30000);

// 模拟全局对象
Object.defineProperty(globalThis, '__HINATA_DEBUG__', {
  value: true,
  writable: true,
  configurable: true
});

// 模拟 console 方法以避免测试输出污染
const originalConsole = { ...console };

beforeAll(() => {
  // 在测试期间静默 console.log，但保留 console.error 和 console.warn
  console.log = jest.fn();
  console.debug = jest.fn();
});

afterAll(() => {
  // 恢复原始 console 方法
  Object.assign(console, originalConsole);
});

// 全局错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.HINATA_TEST_MODE = 'true';