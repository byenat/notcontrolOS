/**
 * Jest 全局清理文件
 * 
 * 在所有测试套件运行完成后执行一次。
 */

export default async function globalTeardown(): Promise<void> {
  console.log('🧹 Cleaning up HiNATA test environment...');
  
  // 清理测试临时文件
  const fs = await import('fs');
  const path = await import('path');
  
  const testTempDir = path.join(__dirname, '..', 'temp');
  if (fs.existsSync(testTempDir)) {
    fs.rmSync(testTempDir, { recursive: true, force: true });
  }
  
  // 清理环境变量
  delete process.env.HINATA_TEST_MODE;
  delete process.env.HINATA_LOG_LEVEL;
  
  console.log('✅ Global test cleanup completed');
}