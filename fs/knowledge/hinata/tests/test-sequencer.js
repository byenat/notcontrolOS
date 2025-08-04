/**
 * Jest 测试序列器
 * 
 * 控制测试文件的执行顺序，确保基础测试先运行。
 */

const Sequencer = require('@jest/test-sequencer').default;

class HiNATATestSequencer extends Sequencer {
  sort(tests) {
    // 定义测试优先级
    const testPriority = {
      'basic.test.ts': 1,
      'types.test.ts': 2,
      'validation.test.ts': 3,
      'packet.test.ts': 4,
      'storage.test.ts': 5,
      'manager.test.ts': 6,
      'kernel.test.ts': 7,
      'integration.test.ts': 8,
      'performance.test.ts': 9
    };

    // 按优先级排序测试
    return tests.sort((testA, testB) => {
      const fileNameA = testA.path.split('/').pop() || '';
      const fileNameB = testB.path.split('/').pop() || '';
      
      const priorityA = testPriority[fileNameA] || 999;
      const priorityB = testPriority[fileNameB] || 999;
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // 如果优先级相同，按文件名字母顺序排序
      return fileNameA.localeCompare(fileNameB);
    });
  }
}

module.exports = HiNATATestSequencer;