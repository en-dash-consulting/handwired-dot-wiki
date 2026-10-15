// Thin re-export of the upstream Handwired runtime (MIT, Cheng Lou), consumed as a
// pinned git dependency. We only use public exports of numeric-ui-core.ts.
export {
  Circuit, emitCompare, emitSelect, emitMinimumExact, emitMaximumExact, emitClampExact, asWire,
  type Wire, type Relation,
} from 'handwired/src/runtime/numeric-ui-core.ts'
