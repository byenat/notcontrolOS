/**
 * Jest 全局设置文件
 * 
 * 在所有测试套件运行之前执行一次。
 */

export default async function globalSetup(): Promise<void> {
  console.log('🚀 Starting HiNATA test suite...');
  
  // 设置测试环境变量
  process.env.NODE_ENV = 'test';
  process.env.HINATA_TEST_MODE = 'true';
  process.env.HINATA_LOG_LEVEL = 'error'; // 减少测试期间的日志输出
  
  // 创建测试所需的临时目录
  const fs = await import('fs');
  const path = await import('path');
  
  const testTempDir = path.join(__dirname, '..', 'temp');
  if (!fs.existsSync(testTempDir)) {
    fs.mkdirSync(testTempDir, { recursive: true });
  }
  
  console.log('✅ Global test setup completed');
}