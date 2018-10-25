import { setupTest } from 'ember-qunit';
import { module, test } from 'qunit';

module('integration/model - inverseFor', function(hooks) {
  setupTest(hooks);
  let store;

  hooks.beforeEach(function() {
    let { owner } = this;

    store = owner.lookup('service:store');
  });

  test(`when a model has no relationships, inverseFor ___`, async function() {

  });

  test(`when a model does not have a relationship by a name, inverseFor ___`, async function() {

  });

  test(`when a model's relationship specifies \`inverse: null\`, inverseFor ___`, async function() {

  });

  test(`when a model's relationship specifies \`inverse: "someMember"\`, inverseFor ___`, async function() {

  });

  test(`when a model's relationship specifies \`inverse: "someMember"\`, inverseFor ___`, async function() {

  });
});
