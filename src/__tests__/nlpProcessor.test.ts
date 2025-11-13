/**
 * LogisticsChatIQ - NLP Processor Tests
 * Author: Jay Atria
 * GitHub: https://github.com/JayAtria-7
 * License: MIT
 * Description: Unit tests for natural language processing functionality
 */

import { NLPProcessor } from '../nlp/processor';
import { Intent, EntityType } from '../models/enums';
import { PackageType, PriorityLevel } from '../models/types';

describe('NLPProcessor', () => {
  let processor: NLPProcessor;

  beforeEach(() => {
    processor = new NLPProcessor();
  });

  describe('Intent Recognition', () => {
    it('should recognize confirm intent', () => {
      const result = processor.process('yes');
      expect(result.intent).toBe(Intent.CONFIRM);
    });

    it('should recognize deny intent', () => {
      const result = processor.process('no');
      expect(result.intent).toBe(Intent.DENY);
    });

    it('should recognize help intent', () => {
      const result = processor.process('help');
      expect(result.intent).toBe(Intent.HELP);
    });

    it('should recognize finish intent', () => {
      const result = processor.process('I\'m done');
      expect(result.intent).toBe(Intent.FINISH);
    });

    it('should recognize same as last intent', () => {
      const result = processor.process('same as last');
      expect(result.intent).toBe(Intent.SAME_AS_LAST);
    });

    it('should recognize skip intent', () => {
      const result = processor.process('skip');
      expect(result.intent).toBe(Intent.SKIP);
    });
  });

  describe('Entity Extraction', () => {
    it('should extract package type', () => {
      const result = processor.process('I have a box');
      const packageTypeEntity = result.entities.find(e => e.type === EntityType.PACKAGE_TYPE);
      
      expect(packageTypeEntity).toBeDefined();
      expect(packageTypeEntity?.value).toBe(PackageType.BOX);
    });

    it('should extract dimensions in LxWxH format', () => {
      const result = processor.process('10 x 5 x 3 cm');
      const dimensionEntity = result.entities.find(e => e.type === EntityType.DIMENSION);
      
      expect(dimensionEntity).toBeDefined();
      expect(dimensionEntity?.value.length).toBe(10);
      expect(dimensionEntity?.value.width).toBe(5);
      expect(dimensionEntity?.value.height).toBe(3);
    });

    it('should extract weight with unit', () => {
      const result = processor.process('5 kg');
      const weightEntity = result.entities.find(e => e.type === EntityType.WEIGHT);
      
      expect(weightEntity).toBeDefined();
      expect(weightEntity?.value.value).toBe(5);
    });

    it('should extract priority level', () => {
      const result = processor.process('I need express shipping');
      const priorityEntity = result.entities.find(e => e.type === EntityType.PRIORITY);
      
      expect(priorityEntity).toBeDefined();
      expect(priorityEntity?.value).toBe(PriorityLevel.EXPRESS);
    });

    it('should extract boolean', () => {
      const result = processor.process('yes');
      const boolEntity = result.entities.find(e => e.type === EntityType.BOOLEAN);
      
      expect(boolEntity).toBeDefined();
      expect(boolEntity?.value).toBe(true);
    });

    it('should extract email', () => {
      const result = processor.process('My email is test@example.com');
      const emailEntity = result.entities.find(e => e.type === EntityType.EMAIL);
      
      expect(emailEntity).toBeDefined();
      expect(emailEntity?.value).toBe('test@example.com');
    });
  });

  describe('Natural Language Understanding', () => {
    it('should understand natural descriptions', () => {
      const result = processor.process('small box, 10 kg, express');
      
      const packageTypeEntity = result.entities.find(e => e.type === EntityType.PACKAGE_TYPE);
      const weightEntity = result.entities.find(e => e.type === EntityType.WEIGHT);
      const priorityEntity = result.entities.find(e => e.type === EntityType.PRIORITY);
      
      expect(packageTypeEntity?.value).toBe(PackageType.BOX);
      expect(weightEntity?.value.value).toBe(10);
      expect(priorityEntity?.value).toBe(PriorityLevel.EXPRESS);
    });
  });
});
