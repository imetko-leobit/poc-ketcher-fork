import {
  atomToStruct,
  bondToStruct,
} from 'domain/serializers/ket/fromKet/atomBondToStruct';
import { moleculeToKet } from 'domain/serializers/ket/toKet/moleculeToKet';
import { Struct } from 'domain/entities/struct';
import { Fragment } from 'domain/entities/fragment';

describe('color round-trip', () => {
  it('atomToStruct preserves color from KET source', () => {
    const source = {
      label: 'C',
      location: [1.0, 2.0, 0.0],
      color: 0xff0000,
    };
    const atom = atomToStruct(source);
    expect(atom.color).toBe(0xff0000);
  });

  it('atomToStruct: missing color leaves field undefined', () => {
    const source = {
      label: 'N',
      location: [0.0, 0.0, 0.0],
    };
    const atom = atomToStruct(source);
    expect(atom.color).toBeUndefined();
  });

  it('bondToStruct preserves color from KET source', () => {
    const source = {
      type: 1,
      atoms: [0, 1],
      color: 0x00ff00,
    };
    const bond = bondToStruct(source, 0);
    expect(bond.color).toBe(0x00ff00);
  });

  it('bondToStruct: missing color leaves field undefined', () => {
    const source = {
      type: 1,
      atoms: [0, 1],
    };
    const bond = bondToStruct(source, 0);
    expect(bond.color).toBeUndefined();
  });

  it('atom clone preserves color', () => {
    const source = { label: 'O', location: [0.0, 0.0, 0.0], color: 0x0000ff };
    const atom = atomToStruct(source);
    const cloned = atom.clone();
    expect(cloned.color).toBe(0x0000ff);
  });

  it('bond clone preserves color', () => {
    const source = { type: 2, atoms: [0, 1], color: 0xabcdef };
    const bond = bondToStruct(source, 0);
    const cloned = bond.clone();
    expect(cloned.color).toBe(0xabcdef);
  });

  it('moleculeToKet emits color for colored atoms', () => {
    const struct = new Struct();
    const atom = atomToStruct({
      label: 'C',
      location: [0, 0, 0],
      color: 0xff0000,
    });
    struct.atoms.add(atom);
    struct.frags.add(new Fragment());
    const ket = moleculeToKet(struct);
    expect(ket.atoms[0].color).toBe(0xff0000);
  });

  it('moleculeToKet omits color for uncolored atoms', () => {
    const struct = new Struct();
    const atom = atomToStruct({ label: 'C', location: [0, 0, 0] });
    struct.atoms.add(atom);
    struct.frags.add(new Fragment());
    const ket = moleculeToKet(struct);
    expect(ket.atoms[0].color).toBeUndefined();
  });

  it('moleculeToKet emits color for colored bonds', () => {
    const struct = new Struct();
    const atom0 = atomToStruct({ label: 'C', location: [0, 0, 0] });
    const atom1 = atomToStruct({ label: 'C', location: [1, 0, 0] });
    struct.atoms.add(atom0);
    struct.atoms.add(atom1);
    struct.frags.add(new Fragment());
    const bond = bondToStruct({ type: 1, atoms: [0, 1], color: 0x00ff00 });
    struct.bonds.add(bond);
    const ket = moleculeToKet(struct);
    expect(ket.bonds[0].color).toBe(0x00ff00);
  });

  it('moleculeToKet omits color for uncolored bonds', () => {
    const struct = new Struct();
    const atom0 = atomToStruct({ label: 'C', location: [0, 0, 0] });
    const atom1 = atomToStruct({ label: 'C', location: [1, 0, 0] });
    struct.atoms.add(atom0);
    struct.atoms.add(atom1);
    struct.frags.add(new Fragment());
    const bond = bondToStruct({ type: 1, atoms: [0, 1] });
    struct.bonds.add(bond);
    const ket = moleculeToKet(struct);
    expect(ket.bonds[0].color).toBeUndefined();
  });
});
