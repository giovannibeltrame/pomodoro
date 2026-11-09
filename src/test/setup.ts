import { act, cleanup } from '@testing-library/preact';
import { afterEach } from 'vitest';

HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
  this.setAttribute('open', '');
};
HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
  this.removeAttribute('open');
};

afterEach(() => act(cleanup));
