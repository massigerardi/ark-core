import { Commands, Container, Contracts, Services, Utils, Components } from "@arkecosystem/core-cli";
import { Networks } from "@arkecosystem/crypto";
import Joi from "@hapi/joi";
import { Container as KernelContainer, Contracts as KernelContracts } from "@arkecosystem/core-kernel";
import { ProgressRenderer } from "../utils/snapshot-progress-renderer";

/**
 * @export
 * @class Command
 * @extends {Commands.Command}
 */
@Container.injectable()
export class Command extends Commands.Command {
    @Container.inject(Container.Identifiers.Logger)
    private readonly logger!: Services.Logger;

    /**
     * The console command signature.
     *
     * @type {string}
     * @memberof Command
     */
    public signature: string = "snapshot:verify";

    /**
     * The console command description.
     *
     * @type {string}
     * @memberof Command
     */
    public description: string = "Check validity of specified snapshot.";

    /**
     * Configure the console command.
     *
     * @returns {void}
     * @memberof Command
     */
    public configure(): void {
        this.definition
            .setFlag("token", "The name of the token.", Joi.string().default("ark"))
            .setFlag("network", "The name of the network.", Joi.string().valid(...Object.keys(Networks)))
            .setFlag("skipCompression", "Skip gzip compression.", Joi.boolean())
            .setFlag("trace", "Dumps generated queries and settings to console.", Joi.boolean())
            .setFlag("blocks", "Blocks to verify, correlates to folder name.", Joi.string())
            .setFlag("verifySignatures", "Verify signatures of specified snapshot.", Joi.boolean());
    }

    /**
     * Execute the console command.
     *
     * @returns {Promise<void>}
     * @memberof Command
     */
    public async execute(): Promise<void> {
        // this.components.fatal("This command has not been implemented.");

        // TODO: abort running processes (core, forger, relay)

        const flags: Contracts.AnyObject = { ...this.getFlags() };
        flags.processType = "snapshot";

        if (!this.getFlag("blocks")) {
            this.logger.error("Blocks flag is missing");
            return;
        }

        let app = await Utils.buildApplication({
            flags,
        });

        if(!app.isBooted()) {
            this.logger.error("App is not booted.");
            return;
        }

        if(!app.isBound(KernelContainer.Identifiers.DatabaseService)) {
            this.logger.error("Database service is not initialized.");
            return;
        }

        if(!app.isBound(KernelContainer.Identifiers.SnapshotService)) {
            this.logger.error("Snapshot service is not initialized.");
            return;
        }

        let spinner = this.app.get<Components.ComponentFactory>(Container.Identifiers.ComponentFactory).spinner();
        new ProgressRenderer(spinner, app);

        await app.get<KernelContracts.Snapshot.SnapshotService>(KernelContainer.Identifiers.SnapshotService).verify(flags);

        this.logger.log("Finish running verify method from CLI");
    }
}
