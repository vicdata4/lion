import { expect } from '@open-wc/testing';
import sinon from 'sinon';

import { DynamicOverlayController } from '../src/DynamicOverlayController.js';
import { BaseController } from '../src/BaseOverlayController.js';

describe('DynamicOverlayController', () => {
  class LocalCtrl extends BaseController {}
  class GlobalCtrl extends BaseController {}

  it('can add/remove controllers', () => {
    const ctrl = new DynamicOverlayController();
    const global = new GlobalCtrl();
    const local = new LocalCtrl();
    const local2 = new LocalCtrl();
    ctrl.add('global', global);
    ctrl.add('local', local);
    ctrl.add('local2', local2);

    expect(ctrl.list).to.deep.equal([global, local, local2]);
    expect(ctrl.data).to.deep.equal({
      global,
      local,
      local2,
    });

    ctrl.remove('local2');
    expect(ctrl.list).to.deep.equal([global, local]);

    ctrl.removeController(local);
    expect(ctrl.list).to.deep.equal([global]);
  });

  it('throws if you try to add the same name twice', () => {
    const ctrl = new DynamicOverlayController();
    const global = new GlobalCtrl();
    const local = new LocalCtrl();
    ctrl.add('global', global);
    expect(() => ctrl.add('global', local)).to.throw('controller name "global" is already taken');
  });

  it('throws if you try to add the same controller with a different name', () => {
    const ctrl = new DynamicOverlayController();
    const global = new GlobalCtrl();
    ctrl.add('global', global);
    expect(() => ctrl.add('local', global)).to.throw(
      'controller instance is already added via controller name "global"',
    );
  });

  it('will set the first added controller as active', () => {
    const ctrl = new DynamicOverlayController();
    expect(ctrl.active).to.be.undefined;

    const global = new GlobalCtrl();
    ctrl.add('global', global);

    expect(ctrl.active).to.equal(global);
  });

  it('will throw if you try to remove the active controller', () => {
    const ctrl = new DynamicOverlayController();
    const global = new GlobalCtrl();
    ctrl.add('global', global);

    expect(() => ctrl.remove('global')).to.throw(
      'You can not remove the active controller named "global". Please switch first to a different controller via ctrl.switchTo()',
    );
  });

  it('can switch the active controller', () => {
    const ctrl = new DynamicOverlayController();
    const global = new GlobalCtrl();
    const local = new LocalCtrl();
    ctrl.add('global', global);
    ctrl.add('local', local);

    expect(ctrl.active).to.equal(global);

    ctrl.switchTo('local');
    expect(ctrl.active).to.equal(local);

    ctrl.switchControllerTo(global);
    expect(ctrl.active).to.equal(global);
  });

  it('will call switchIn/Out functions of controllers', () => {
    const ctrl = new DynamicOverlayController();
    const global = new GlobalCtrl();
    const local = new LocalCtrl();
    ctrl.add('global', global);
    ctrl.add('local', local);

    const globalOutSpy = sinon.spy(global, 'switchOut');
    const globalInSpy = sinon.spy(global, 'switchIn');
    const localOutSpy = sinon.spy(local, 'switchOut');
    const localInSpy = sinon.spy(local, 'switchIn');

    ctrl.switchTo('local');
    expect(globalOutSpy).to.have.callCount(1);
    expect(localInSpy).to.have.callCount(1);

    ctrl.switchTo('global');
    expect(globalInSpy).to.have.callCount(1);
    expect(localOutSpy).to.have.callCount(1);

    // sanity check that wrong functions are not called
    expect(globalOutSpy).to.have.callCount(1);
    expect(localInSpy).to.have.callCount(1);
  });

  it('will call the active controllers show/hide when using .show() / .hide()', async () => {
    const ctrl = new DynamicOverlayController();
    const global = new GlobalCtrl();
    ctrl.add('global', global);

    const showSpy = sinon.spy(global, 'show');
    const hideSpy = sinon.spy(global, 'hide');

    await ctrl.show();
    expect(showSpy).to.has.callCount(1);

    await ctrl.hide();
    expect(hideSpy).to.has.callCount(1);
  });
});
