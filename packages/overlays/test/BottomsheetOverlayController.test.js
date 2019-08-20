
import { expect } from '@open-wc/testing';

import { GlobalOverlayController } from '../src/GlobalOverlayController.js';
import { BottomsheetOverlayController } from '../src/BottomsheetOverlayController.js';

describe('BottomsheetOverlayController', () => {
  it('extends BottomsheetOverlayController', () => {
    expect(new BottomsheetOverlayController()).to.be.instanceof(GlobalOverlayController);
  });

  it('has correct defaults', () => {
    const controller = new BottomsheetOverlayController();
    expect(controller.hasBackdrop).to.equal(true);
    expect(controller.isBlocking).to.equal(false);
    expect(controller.preventsScroll).to.equal(true);
    expect(controller.trapsKeyboardFocus).to.equal(true);
    expect(controller.hidesOnEsc).to.equal(true);
    expect(controller.viewportConfig.placement).to.equal('bottom');
  });
});
