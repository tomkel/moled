// import peg from 'pegjs'
// const parser = peg.generate()
import smiles from 'smiles'

const tokens = smiles.parse('IC(C=C1OC)=C(OC)C=C1CC(C)N')

console.log(tokens)
