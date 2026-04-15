/**
 * Dependency Injection Container
 *
 * Wires together repositories and use cases.
 * Single source of truth for how infrastructure is instantiated.
 */

import {
  SupabaseWishRepository,
  SupabaseWishRecipientRepository,
  SupabaseConnectionRepository,
  SupabaseConnectionRequestRepository,
  SupabaseBlockedUserRepository,
} from "./supabase";
import {
  SendWishUseCase,
  AcceptWishUseCase,
  RejectWishUseCase,
  FulfillWishUseCase,
  ProposeWishDateUseCase,
  ConfirmWishDateUseCase,
  SendConnectionRequestUseCase,
  AcceptConnectionRequestUseCase,
  BlockUserUseCase,
} from "../application";
import { EventEmitter } from "./EventEmitter";

/**
 * Container holds all singletons
 * Usage:
 *   const container = DIContainer.getInstance();
 *   const sendWish = container.getSendWishUseCase();
 */
export class DIContainer {
  private static instance: DIContainer;

  // Repositories
  private wishRepository: SupabaseWishRepository;
  private wishRecipientRepository: SupabaseWishRecipientRepository;
  private connectionRepository: SupabaseConnectionRepository;
  private connectionRequestRepository: SupabaseConnectionRequestRepository;
  private blockedUserRepository: SupabaseBlockedUserRepository;

  // Event bus
  private eventEmitter: EventEmitter;

  // Use cases
  private sendWishUseCase: SendWishUseCase;
  private acceptWishUseCase: AcceptWishUseCase;
  private rejectWishUseCase: RejectWishUseCase;
  private fulfillWishUseCase: FulfillWishUseCase;
  private proposeWishDateUseCase: ProposeWishDateUseCase;
  private confirmWishDateUseCase: ConfirmWishDateUseCase;
  private sendConnectionRequestUseCase: SendConnectionRequestUseCase;
  private acceptConnectionRequestUseCase: AcceptConnectionRequestUseCase;
  private blockUserUseCase: BlockUserUseCase;

  private constructor() {
    // Initialize repositories
    this.wishRepository = new SupabaseWishRepository();
    this.wishRecipientRepository = new SupabaseWishRecipientRepository();
    this.connectionRepository = new SupabaseConnectionRepository();
    this.connectionRequestRepository = new SupabaseConnectionRequestRepository();
    this.blockedUserRepository = new SupabaseBlockedUserRepository();

    // Initialize event emitter
    this.eventEmitter = new EventEmitter();

    // Initialize use cases
    this.sendWishUseCase = new SendWishUseCase(
      this.wishRepository,
      this.wishRecipientRepository,
      this.eventEmitter
    );
    this.acceptWishUseCase = new AcceptWishUseCase(
      this.wishRepository,
      this.wishRecipientRepository,
      this.eventEmitter
    );
    this.rejectWishUseCase = new RejectWishUseCase(
      this.wishRepository,
      this.wishRecipientRepository,
      this.eventEmitter
    );
    this.fulfillWishUseCase = new FulfillWishUseCase(
      this.wishRepository,
      this.wishRecipientRepository,
      this.eventEmitter
    );
    this.proposeWishDateUseCase = new ProposeWishDateUseCase(
      this.wishRepository,
      this.eventEmitter
    );
    this.confirmWishDateUseCase = new ConfirmWishDateUseCase(
      this.wishRepository,
      this.eventEmitter
    );
    this.sendConnectionRequestUseCase = new SendConnectionRequestUseCase(
      this.connectionRequestRepository,
      this.eventEmitter
    );
    this.acceptConnectionRequestUseCase = new AcceptConnectionRequestUseCase(
      this.connectionRequestRepository,
      this.connectionRepository,
      this.eventEmitter
    );
    this.blockUserUseCase = new BlockUserUseCase(
      this.connectionRepository,
      this.blockedUserRepository,
      this.eventEmitter
    );
  }

  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  // Repository accessors
  getWishRepository(): SupabaseWishRepository {
    return this.wishRepository;
  }

  getWishRecipientRepository(): SupabaseWishRecipientRepository {
    return this.wishRecipientRepository;
  }

  getConnectionRepository(): SupabaseConnectionRepository {
    return this.connectionRepository;
  }

  getConnectionRequestRepository(): SupabaseConnectionRequestRepository {
    return this.connectionRequestRepository;
  }

  getBlockedUserRepository(): SupabaseBlockedUserRepository {
    return this.blockedUserRepository;
  }

  getEventEmitter(): EventEmitter {
    return this.eventEmitter;
  }

  // Use case accessors
  getSendWishUseCase(): SendWishUseCase {
    return this.sendWishUseCase;
  }

  getAcceptWishUseCase(): AcceptWishUseCase {
    return this.acceptWishUseCase;
  }

  getRejectWishUseCase(): RejectWishUseCase {
    return this.rejectWishUseCase;
  }

  getFulfillWishUseCase(): FulfillWishUseCase {
    return this.fulfillWishUseCase;
  }

  getProposeWishDateUseCase(): ProposeWishDateUseCase {
    return this.proposeWishDateUseCase;
  }

  getConfirmWishDateUseCase(): ConfirmWishDateUseCase {
    return this.confirmWishDateUseCase;
  }

  getSendConnectionRequestUseCase(): SendConnectionRequestUseCase {
    return this.sendConnectionRequestUseCase;
  }

  getAcceptConnectionRequestUseCase(): AcceptConnectionRequestUseCase {
    return this.acceptConnectionRequestUseCase;
  }

  getBlockUserUseCase(): BlockUserUseCase {
    return this.blockUserUseCase;
  }
}
