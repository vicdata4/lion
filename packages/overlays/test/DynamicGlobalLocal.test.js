import { expect, html, fixture } from '@open-wc/testing';

import { DynamicOverlayController } from '../src/DynamicOverlayController.js';
import { GlobalOverlayController } from '../src/GlobalOverlayController.js';
import { LocalOverlayController } from '../src/LocalOverlayController.js';

describe('Dynamic Global and Local Overlay Controller switching', () => {
  let expectGlobalShown;
  let expectGlobalHidden;
  let expectLocalShown;
  let expectLocalHidden;

  before(() => {
    expectGlobalShown = () =>
      expect(document.body.querySelector('.global-overlays')).lightDom.to.equal(/* html */ `
        <p>Content</p>
      `);
    expectGlobalHidden = () =>
      expect(document.body.querySelectorAll('.global-overlays').length).to.equal(0);

    expectLocalShown = el =>
      expect(el).dom.to.equal(/* html */ `
        <div>
          <div style="display: inline-block"><button>Invoker</button></div>
          <div style="display: inline-block">Content</div>
        </div>
      `);
    expectLocalHidden = el =>
      expect(el).dom.to.equal(/* html */ `
        <div>
          <div style="display: inline-block"><button>Invoker</button></div>
          <div style="display: inline-block"></div>
        </div>
      `);
  });

  it('can switch between global/local with templates while being shown', async () => {
    const options = {
      contentTemplate: () => html`
        <p>Content</p>
      `,
      invokerTemplate: () => html`
        <button>Invoker</button>
      `,
    };
    const ctrl = new DynamicOverlayController();
    const global = new GlobalOverlayController(options);
    const local = new LocalOverlayController(options);
    ctrl.add('global', global);
    ctrl.add('local', local);

    const el = await fixture(html`
      <div>
        ${ctrl.invoker} ${ctrl.content}
      </div>
    `);

    await ctrl.show();
    expectGlobalShown();
    expectLocalHidden(el);

    await ctrl.switchTo('local');
    expectGlobalHidden();
    expectLocalShown(el);
  });

  it('can switch between global/local with nodes while being shown', async () => {
    const invokerNode = await fixture('<button>Invoker</button>');
    const contentNode = await fixture(`<p>Content</p>`);

    const options = {
      invokerNode,
      contentNode,
    };
    const ctrl = new DynamicOverlayController();
    const global = new GlobalOverlayController(options);
    const local = new LocalOverlayController(options);
    ctrl.add('global', global);
    ctrl.add('local', local);

    const el = await fixture(html`
      <div>
        ${ctrl.invoker} ${ctrl.content}
      </div>
    `);

    await ctrl.show();
    expectGlobalShown();
    expectLocalHidden(el);

    await ctrl.switchTo('local');
    expectGlobalHidden();
    expectLocalShown(el);
  });

  it('can switch between global/local with nodes while being hidden', async () => {
    const invokerNode = await fixture('<button>Invoker</button>');
    const contentNode = await fixture(`<p>Content</p>`);

    const options = {
      invokerNode,
      contentNode,
    };
    const ctrl = new DynamicOverlayController();
    const global = new GlobalOverlayController(options);
    const local = new LocalOverlayController(options);
    ctrl.add('global', global);
    ctrl.add('local', local);

    const el = await fixture(html`
      <div>
        ${ctrl.invoker} ${ctrl.content}
      </div>
    `);

    await ctrl.show();
    expectGlobalShown();
    expectLocalHidden(el);

    await ctrl.hide();
    expectGlobalHidden();
    expectLocalHidden(el);

    await ctrl.switchTo('local');
    expectGlobalHidden();
    expectLocalHidden(el);

    await ctrl.show();
    expectGlobalHidden();
    expectLocalShown(el);
  });
});
