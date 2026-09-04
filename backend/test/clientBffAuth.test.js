const assert = require("node:assert/strict");
const test = require("node:test");

const { bindLegacyClientBffInstance } = require("../src/middleware/clientBffAuth");

const legacyInstance = (overrides = {}) => ({
  id: "legacy-instance",
  userId: 42,
  siteId: null,
  name: null,
  publicKey: "public-key",
  bootstrapPublicProfileBase64: "profile",
  accessTokenHash: "a".repeat(64),
  status: "active",
  lastSeenAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const database = (sites) => {
  const updates = [];
  return {
    updates,
    userSite: {
      findMany: async () => sites.map((id) => ({ id })),
    },
    clientBffInstance: {
      update: async ({ data }) => {
        updates.push(data);
        return legacyInstance(data);
      },
    },
  };
};

test("旧 BFF 实例在只有一个可用品牌时自动绑定", async () => {
  const mock = database([7]);
  const result = await bindLegacyClientBffInstance(legacyInstance(), mock);
  assert.equal(result.siteId, 7);
  assert.deepEqual(mock.updates, [{ siteId: 7 }]);
});

test("旧 BFF 实例在没有或存在多个可用品牌时不自动绑定", async () => {
  for (const sites of [[], [7, 8]]) {
    const mock = database(sites);
    const result = await bindLegacyClientBffInstance(legacyInstance(), mock);
    assert.equal(result, null);
    assert.deepEqual(mock.updates, []);
  }
});

test("已绑定的 BFF 实例保持原品牌", async () => {
  const mock = database([8]);
  const result = await bindLegacyClientBffInstance(legacyInstance({ siteId: 7 }), mock);
  assert.equal(result.siteId, 7);
  assert.deepEqual(mock.updates, []);
});
