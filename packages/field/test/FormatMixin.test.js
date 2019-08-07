import { expect, fixture, html, aTimeout, defineCE, unsafeStatic } from '@open-wc/testing';
import sinon from 'sinon';

import { LitElement } from '@lion/core';
import { Unparseable } from '@lion/validate';
import { FormatMixin } from '../src/FormatMixin.js';

function mimicUserInput(formControl, newViewValue) {
  formControl.value = newViewValue; // eslint-disable-line no-param-reassign
  formControl.inputElement.dispatchEvent(new CustomEvent('input', { bubbles: true }));
}

describe('FormatMixin', () => {
  let tag;
  before(async () => {
    const tagString = defineCE(
      class extends FormatMixin(LitElement) {
        render() {
          return html`
            <slot name="input"></slot>
          `;
        }

        set value(newValue) {
          this.inputElement.value = newValue;
        }

        get value() {
          return this.inputElement.value;
        }

        get inputElement() {
          return this.querySelector('input');
        }
      },
    );
    tag = unsafeStatic(tagString);
  });

  it('fires `model-value-changed` for every change on the input', async () => {
    const el = await fixture(html`<${tag}><input slot="input"></${tag}>`);
    let counter = 0;
    el.addEventListener('model-value-changed', () => {
      counter += 1;
    });

    mimicUserInput(el, 'one');
    expect(counter).to.equal(1);

    // no change means no event
    mimicUserInput(el, 'one');
    expect(counter).to.equal(1);

    mimicUserInput(el, 'two');
    expect(counter).to.equal(2);
  });

  it('fires `model-value-changed` for every modelValue change', async () => {
    const el = await fixture(html`<${tag}><input slot="input"></${tag}>`);
    let counter = 0;
    el.addEventListener('model-value-changed', () => {
      counter += 1;
    });

    el.modelValue = 'one';
    expect(counter).to.equal(1);

    // no change means no event
    el.modelValue = 'one';
    expect(counter).to.equal(1);

    el.modelValue = 'two';
    expect(counter).to.equal(2);
  });

  it('has modelValue, formattedValue and serializedValue which are computed synchronously', async () => {
    const el = await fixture(html`<${tag}><input slot="input"></${tag}>`);
    expect(el.modelValue).to.equal('', 'modelValue initially');
    expect(el.formattedValue).to.equal('', 'formattedValue initially');
    expect(el.serializedValue).to.equal('', 'serializedValue initially');
    el.modelValue = 'string';
    expect(el.modelValue).to.equal('string', 'modelValue as provided');
    expect(el.formattedValue).to.equal('string', 'formattedValue synchronized');
    expect(el.serializedValue).to.equal('string', 'serializedValue synchronized');
  });

  it('synchronizes inputElement.value as a fallback mechanism', async () => {
    // Note that in lion-field, the attribute would be put on <lion-field>, not on <input>
    const el = await fixture(html`
      <${tag}
        value="string",
        .formatter=${value => `foo: ${value}`}
        .parser=${value => value.replace('foo: ', '')}
        .serializer=${value => `[foo] ${value}`}
        .deserializer=${value => value.replace('[foo] ', '')}
        ><input slot="input" value="string"/>
      </${tag}>
    `);
    // Now check if the format/parse/serialize loop has been triggered
    await aTimeout();
    expect(el.formattedValue).to.equal('foo: string');
    expect(el.inputElement.value).to.equal('foo: string');
    expect(el.serializedValue).to.equal('[foo] string');
    expect(el.modelValue).to.equal('string');
  });

  it('reflects back formatted value to user on leave', async () => {
    const el = await fixture(html`
      <${tag} .formatter="${value => `foo: ${value}`}">
        <input slot="input" />
      </${tag}>
    `);
    // users types value 'test'
    mimicUserInput(el, 'test');
    expect(el.inputElement.value).to.not.equal('foo: test');
    // user leaves field
    el.inputElement.dispatchEvent(new CustomEvent(el.formatOn, { bubbles: true }));
    await aTimeout();
    expect(el.inputElement.value).to.equal('foo: test');
  });

  it('reflects back .formattedValue immediately when .modelValue changed imperatively', async () => {
    const el = await fixture(html`
      <${tag} .formatter="${value => `foo: ${value}`}">
        <input slot="input" />
      </${tag}>
    `);
    // The FormatMixin can be used in conjunction with the ValidateMixin, in which case
    // it can hold errorState (affecting the formatting)
    el.errorState = true;

    // users types value 'test'
    mimicUserInput(el, 'test');
    expect(el.inputElement.value).to.not.equal('foo: test');

    // Now see the difference for an imperative change
    el.modelValue = 'test2';
    expect(el.inputElement.value).to.equal('foo: test2');
  });

  it('works if there is no underlying inputElement', async () => {
    const tagNoInputString = defineCE(class extends FormatMixin(LitElement) {});
    const tagNoInput = unsafeStatic(tagNoInputString);
    expect(async () => {
      await fixture(html`<${tagNoInput}></${tagNoInput}>`);
    }).to.not.throw();
  });

  describe('foo parsers/formatters/serializers example', () => {
    let fooFormatEl;
    before(async () => {
      fooFormatEl = await fixture(html`
      <${tag}
        .formatter="${value => `foo: ${value}`}"
        .parser="${value => value.replace('foo: ', '')}"
        .serializer="${value => `[foo] ${value}`}"
        .deserializer="${value => value.replace('[foo] ', '')}"
      ><input slot="input">
      </${tag}>`);
    });

    it('has an input node (like <input>/<textarea>) which holds the formatted (view) value', async () => {
      fooFormatEl.modelValue = 'string';
      expect(fooFormatEl.formattedValue).to.equal('foo: string');
      expect(fooFormatEl.value).to.equal('foo: string');
      expect(fooFormatEl.inputElement.value).to.equal('foo: string');
    });

    it('converts modelValue => formattedValue (via this.formatter)', async () => {
      fooFormatEl.modelValue = 'string';
      expect(fooFormatEl.formattedValue).to.equal('foo: string');
      expect(fooFormatEl.serializedValue).to.equal('[foo] string');
    });

    it('converts modelValue => serializedValue (via this.serializer)', async () => {
      fooFormatEl.modelValue = 'string';
      expect(fooFormatEl.serializedValue).to.equal('[foo] string');
    });

    it('converts formattedValue => modelValue (via this.parser)', async () => {
      fooFormatEl.formattedValue = 'foo: string';
      expect(fooFormatEl.modelValue).to.equal('string');
    });

    it('converts serializedValue => modelValue (via this.deserializer)', async () => {
      fooFormatEl.serializedValue = '[foo] string';
      expect(fooFormatEl.modelValue).to.equal('string');
    });
  });

  describe('parsers/formatters/serializers', () => {
    it('should call the parser|formatter|serializer provided by user', async () => {
      const formatterSpy = sinon.spy(value => `foo: ${value}`);
      const parserSpy = sinon.spy(value => value.replace('foo: ', ''));
      const serializerSpy = sinon.spy(value => `[foo] ${value}`);
      const el = await fixture(html`
        <${tag}
          .formatter=${formatterSpy}
          .parser=${parserSpy}
          .serializer=${serializerSpy}
          .modelValue=${'test'}
        >
          <input slot="input">
        </${tag}>
      `);
      expect(formatterSpy.called).to.equal(true);
      expect(serializerSpy.called).to.equal(true);

      el.formattedValue = 'raw';
      expect(parserSpy.called).to.equal(true);
    });

    it('should have formatOptions available in formatter', async () => {
      const formatterSpy = sinon.spy(value => `foo: ${value}`);
      await fixture(html`
        <${tag}
          value="string",
          .formatter="${formatterSpy}"
          .formatOptions="${{ locale: 'en-GB', decimalSeparator: '-' }}">
          <input slot="input" value="string">
        </${tag}>`);
      await aTimeout();
      expect(formatterSpy.args[0][1].locale).to.equal('en-GB');
      expect(formatterSpy.args[0][1].decimalSeparator).to.equal('-');
    });

    it('will only call the parser for defined values', async () => {
      const parserSpy = sinon.spy();
      const el = await fixture(html`
        <${tag} .parser="${parserSpy}">
          <input slot="input" value="string">
        </${tag}>
      `);
      el.modelValue = 'foo';
      expect(parserSpy.callCount).to.equal(1);
      // This could happen for instance in a reset
      el.modelValue = undefined;
      expect(parserSpy.callCount).to.equal(1);
      // This could happen when the user erases the input value
      mimicUserInput(el, '');
      expect(parserSpy.callCount).to.equal(1);
    });

    it('will not return Unparseable when empty strings are inputted', async () => {
      const el = await fixture(html`
        <${tag}>
          <input slot="input" value="string">
        </${tag}>
      `);
      // This could happen when the user erases the input value
      mimicUserInput(el, '');
      // For backwards compatibility, we keep the modelValue an empty string here.
      // Undefined would be more appropriate 'conceptually', however
      expect(el.modelValue).to.equal('');
    });

    it('will only call the formatter for valid values on `user-input-changed` ', async () => {
      const formatterSpy = sinon.spy(value => `foo: ${value}`);
      const el = await fixture(html`
        <${tag} .formatter=${formatterSpy}>
          <input slot="input" value="init-string">
        </${tag}>
      `);
      expect(formatterSpy.callCount).to.equal(1);

      el.errorState = true;
      mimicUserInput(el, 'bar');
      expect(formatterSpy.callCount).to.equal(1);
      expect(el.formattedValue).to.equal('bar');

      el.errorState = false;
      mimicUserInput(el, 'bar2');
      expect(formatterSpy.callCount).to.equal(2);

      expect(el.formattedValue).to.equal('foo: bar2');
    });
  });

  describe('Unparseable values', () => {
    it('should convert to Unparseable when wrong value inputted by user', async () => {
      const el = await fixture(html`
        <${tag}
          .parser=${viewValue => Number(viewValue) || undefined}
        >
          <input slot="input">
        </${tag}>
      `);
      mimicUserInput(el, 'test');
      expect(el.modelValue).to.be.an.instanceof(Unparseable);
    });

    it('should preserve the viewValue when not parseable', async () => {
      const el = await fixture(html`
        <${tag}
          .parser=${viewValue => Number(viewValue) || undefined}
        >
          <input slot="input">
        </${tag}>
      `);
      mimicUserInput(el, 'test');
      expect(el.formattedValue).to.equal('test');
      expect(el.value).to.equal('test');
    });

    it('should display the viewValue when modelValue is of type Unparseable', async () => {
      const el = await fixture(html`
        <${tag}
          .parser=${viewValue => Number(viewValue) || undefined}
        >
          <input slot="input">
        </${tag}>
      `);
      el.modelValue = new Unparseable('foo');
      expect(el.value).to.equal('foo');
    });
  });
});
