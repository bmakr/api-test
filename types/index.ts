import { Redis } from "@upstash/redis";

export type User = {
  id: number;
  createdAt: number;
  email: string;
  roles: Roles;
  stripeCustomerId?: string;
  names?: string[];
  signedUpAt?: number;
  loggedInAts?: number[];
  invitedBys?: number[];
  invitedAts?: number[];
  isStripeCustomer?: boolean;
}
export type AllowedRoles = 'free' | 
'performer' | 
'beta' | 
'goat' |
'enterprise' | 
'admin' |
'coach'

export type Action = {
  id: number,
  teamId: number;
  createdAt: number;
  type: 'invitation' | 'completion';
  targetId?: number; // inviteeId
  actorId: number; // inviterId
  deckId?: number;
  description: string;
}

export type Roles = AllowedRoles[]

export type Session = {
  id: number;
  passcode?: number;
  createdAt?: number;
  userId: number;
}

export type Deck = {
  id: number;
  userId: number;
  title: string;
  description: string;
  query?: string; 
  challengeId?: number;
  mcqs: Mcq[];
  // when a doc is uploaded deck.isUpload is set to true
  isUpload?: boolean;
  documentText?: string; // max savable is 100_000_000 chars according to upstash
}

export type Mcq = {
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
  isHidden?: boolean;
};

export type Results = {
  resultsInBits: number[];
  selections: number[];
  correctOptionsIndexes: number[];
  incorrectOptionsIndexes: number[];
}

// export type Response<T> = { 
//   error?: string; 
//   id?: string; 
//   status: number; 
//   data?: T;
//   message?: string;
// }

export interface KeyValues {
  [key: string]: any
}

// export type Val = string;

export type Params = { params: { id?: string; slug?: string; } }


export type Lead = {
  name: string;
  createdAt: number;
  userId: number;
  email: string;
  query: string;
  goals: string;
  organization?: string;
  phone: string;
  status: string;
}

export type SelectionItems = {
  name: string;
}[]


export type ConnectionAndBody = {
  conn: Redis;
  body?: any;
}