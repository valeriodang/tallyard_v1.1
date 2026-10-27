// Design from stock (round 3, BRIEF section 15.6): how the architect matches a steel schedule against stock.

/** The architect's matching settings for a project. Stored on the project; absent until first set. */
export type StockMatchSettings = {
  /** Cut a long stock piece into several members. Off: one piece serves one member. */
  cutToLength: boolean
  /** With cutting, offcuts at least this long go back to stock; shorter ones are scrap. */
  minOffcutM: number
  /** Pass over stock that would be more than the excess share. */
  excessRule: boolean
  /** Count stock of unknown grade, flagged for testing. */
  allowUnknownGrade: boolean
  /** The schedule's file name and the day it was loaded, when the architect loaded one. */
  fileName: string | null
  loadedOn: string | null
}
