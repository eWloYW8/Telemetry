import * as $protobuf from "protobufjs";
import Long = require("long");
/** Namespace telemetry. */
export namespace telemetry {

    /** Namespace v1. */
    namespace v1 {

        /** Properties of a NodeSnapshot. */
        interface INodeSnapshot {

            /** NodeSnapshot nodeId */
            nodeId?: (string|null);

            /** NodeSnapshot connected */
            connected?: (boolean|null);

            /** NodeSnapshot lastSeenUnixNano */
            lastSeenUnixNano?: (number|Long|null);

            /** NodeSnapshot registration */
            registration?: (telemetry.v1.IRegistration|null);

            /** NodeSnapshot latest */
            latest?: (telemetry.v1.IMetricSample[]|null);
        }

        /** Represents a NodeSnapshot. */
        class NodeSnapshot implements INodeSnapshot {

            /**
             * Constructs a new NodeSnapshot.
             * @param [properties] Properties to set
             */
            constructor(properties?: telemetry.v1.INodeSnapshot);

            /** NodeSnapshot nodeId. */
            public nodeId: string;

            /** NodeSnapshot connected. */
            public connected: boolean;

            /** NodeSnapshot lastSeenUnixNano. */
            public lastSeenUnixNano: (number|Long);

            /** NodeSnapshot registration. */
            public registration?: (telemetry.v1.IRegistration|null);

            /** NodeSnapshot latest. */
            public latest: telemetry.v1.IMetricSample[];

            /**
             * Creates a new NodeSnapshot instance using the specified properties.
             * @param [properties] Properties to set
             * @returns NodeSnapshot instance
             */
            public static create(properties?: telemetry.v1.INodeSnapshot): telemetry.v1.NodeSnapshot;

            /**
             * Encodes the specified NodeSnapshot message. Does not implicitly {@link telemetry.v1.NodeSnapshot.verify|verify} messages.
             * @param message NodeSnapshot message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: telemetry.v1.INodeSnapshot, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified NodeSnapshot message, length delimited. Does not implicitly {@link telemetry.v1.NodeSnapshot.verify|verify} messages.
             * @param message NodeSnapshot message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: telemetry.v1.INodeSnapshot, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a NodeSnapshot message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns NodeSnapshot
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.v1.NodeSnapshot;

            /**
             * Decodes a NodeSnapshot message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns NodeSnapshot
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.v1.NodeSnapshot;

            /**
             * Verifies a NodeSnapshot message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a NodeSnapshot message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns NodeSnapshot
             */
            public static fromObject(object: { [k: string]: any }): telemetry.v1.NodeSnapshot;

            /**
             * Creates a plain object from a NodeSnapshot message. Also converts values to other types if specified.
             * @param message NodeSnapshot
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: telemetry.v1.NodeSnapshot, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this NodeSnapshot to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for NodeSnapshot
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a ListNodesResponse. */
        interface IListNodesResponse {

            /** ListNodesResponse nodes */
            nodes?: (telemetry.v1.INodeSnapshot[]|null);
        }

        /** Represents a ListNodesResponse. */
        class ListNodesResponse implements IListNodesResponse {

            /**
             * Constructs a new ListNodesResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: telemetry.v1.IListNodesResponse);

            /** ListNodesResponse nodes. */
            public nodes: telemetry.v1.INodeSnapshot[];

            /**
             * Creates a new ListNodesResponse instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ListNodesResponse instance
             */
            public static create(properties?: telemetry.v1.IListNodesResponse): telemetry.v1.ListNodesResponse;

            /**
             * Encodes the specified ListNodesResponse message. Does not implicitly {@link telemetry.v1.ListNodesResponse.verify|verify} messages.
             * @param message ListNodesResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: telemetry.v1.IListNodesResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ListNodesResponse message, length delimited. Does not implicitly {@link telemetry.v1.ListNodesResponse.verify|verify} messages.
             * @param message ListNodesResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: telemetry.v1.IListNodesResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ListNodesResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ListNodesResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.v1.ListNodesResponse;

            /**
             * Decodes a ListNodesResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ListNodesResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.v1.ListNodesResponse;

            /**
             * Verifies a ListNodesResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ListNodesResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ListNodesResponse
             */
            public static fromObject(object: { [k: string]: any }): telemetry.v1.ListNodesResponse;

            /**
             * Creates a plain object from a ListNodesResponse message. Also converts values to other types if specified.
             * @param message ListNodesResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: telemetry.v1.ListNodesResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ListNodesResponse to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for ListNodesResponse
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a NodeModulesResponse. */
        interface INodeModulesResponse {

            /** NodeModulesResponse modules */
            modules?: (telemetry.v1.IModuleRegistration[]|null);
        }

        /** Represents a NodeModulesResponse. */
        class NodeModulesResponse implements INodeModulesResponse {

            /**
             * Constructs a new NodeModulesResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: telemetry.v1.INodeModulesResponse);

            /** NodeModulesResponse modules. */
            public modules: telemetry.v1.IModuleRegistration[];

            /**
             * Creates a new NodeModulesResponse instance using the specified properties.
             * @param [properties] Properties to set
             * @returns NodeModulesResponse instance
             */
            public static create(properties?: telemetry.v1.INodeModulesResponse): telemetry.v1.NodeModulesResponse;

            /**
             * Encodes the specified NodeModulesResponse message. Does not implicitly {@link telemetry.v1.NodeModulesResponse.verify|verify} messages.
             * @param message NodeModulesResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: telemetry.v1.INodeModulesResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified NodeModulesResponse message, length delimited. Does not implicitly {@link telemetry.v1.NodeModulesResponse.verify|verify} messages.
             * @param message NodeModulesResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: telemetry.v1.INodeModulesResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a NodeModulesResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns NodeModulesResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.v1.NodeModulesResponse;

            /**
             * Decodes a NodeModulesResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns NodeModulesResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.v1.NodeModulesResponse;

            /**
             * Verifies a NodeModulesResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a NodeModulesResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns NodeModulesResponse
             */
            public static fromObject(object: { [k: string]: any }): telemetry.v1.NodeModulesResponse;

            /**
             * Creates a plain object from a NodeModulesResponse message. Also converts values to other types if specified.
             * @param message NodeModulesResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: telemetry.v1.NodeModulesResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this NodeModulesResponse to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for NodeModulesResponse
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a TimedSample. */
        interface ITimedSample {

            /** TimedSample nodeId */
            nodeId?: (string|null);

            /** TimedSample sample */
            sample?: (telemetry.v1.IMetricSample|null);
        }

        /** Represents a TimedSample. */
        class TimedSample implements ITimedSample {

            /**
             * Constructs a new TimedSample.
             * @param [properties] Properties to set
             */
            constructor(properties?: telemetry.v1.ITimedSample);

            /** TimedSample nodeId. */
            public nodeId: string;

            /** TimedSample sample. */
            public sample?: (telemetry.v1.IMetricSample|null);

            /**
             * Creates a new TimedSample instance using the specified properties.
             * @param [properties] Properties to set
             * @returns TimedSample instance
             */
            public static create(properties?: telemetry.v1.ITimedSample): telemetry.v1.TimedSample;

            /**
             * Encodes the specified TimedSample message. Does not implicitly {@link telemetry.v1.TimedSample.verify|verify} messages.
             * @param message TimedSample message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: telemetry.v1.ITimedSample, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified TimedSample message, length delimited. Does not implicitly {@link telemetry.v1.TimedSample.verify|verify} messages.
             * @param message TimedSample message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: telemetry.v1.ITimedSample, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a TimedSample message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns TimedSample
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.v1.TimedSample;

            /**
             * Decodes a TimedSample message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns TimedSample
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.v1.TimedSample;

            /**
             * Verifies a TimedSample message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a TimedSample message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns TimedSample
             */
            public static fromObject(object: { [k: string]: any }): telemetry.v1.TimedSample;

            /**
             * Creates a plain object from a TimedSample message. Also converts values to other types if specified.
             * @param message TimedSample
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: telemetry.v1.TimedSample, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this TimedSample to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for TimedSample
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a SamplesResponse. */
        interface ISamplesResponse {

            /** SamplesResponse samples */
            samples?: (telemetry.v1.ITimedSample[]|null);
        }

        /** Represents a SamplesResponse. */
        class SamplesResponse implements ISamplesResponse {

            /**
             * Constructs a new SamplesResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: telemetry.v1.ISamplesResponse);

            /** SamplesResponse samples. */
            public samples: telemetry.v1.ITimedSample[];

            /**
             * Creates a new SamplesResponse instance using the specified properties.
             * @param [properties] Properties to set
             * @returns SamplesResponse instance
             */
            public static create(properties?: telemetry.v1.ISamplesResponse): telemetry.v1.SamplesResponse;

            /**
             * Encodes the specified SamplesResponse message. Does not implicitly {@link telemetry.v1.SamplesResponse.verify|verify} messages.
             * @param message SamplesResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: telemetry.v1.ISamplesResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified SamplesResponse message, length delimited. Does not implicitly {@link telemetry.v1.SamplesResponse.verify|verify} messages.
             * @param message SamplesResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: telemetry.v1.ISamplesResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a SamplesResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns SamplesResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.v1.SamplesResponse;

            /**
             * Decodes a SamplesResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns SamplesResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.v1.SamplesResponse;

            /**
             * Verifies a SamplesResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a SamplesResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns SamplesResponse
             */
            public static fromObject(object: { [k: string]: any }): telemetry.v1.SamplesResponse;

            /**
             * Creates a plain object from a SamplesResponse message. Also converts values to other types if specified.
             * @param message SamplesResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: telemetry.v1.SamplesResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this SamplesResponse to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for SamplesResponse
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of an ErrorResponse. */
        interface IErrorResponse {

            /** ErrorResponse error */
            error?: (string|null);

            /** ErrorResponse timeUnixNano */
            timeUnixNano?: (number|Long|null);
        }

        /** Represents an ErrorResponse. */
        class ErrorResponse implements IErrorResponse {

            /**
             * Constructs a new ErrorResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: telemetry.v1.IErrorResponse);

            /** ErrorResponse error. */
            public error: string;

            /** ErrorResponse timeUnixNano. */
            public timeUnixNano: (number|Long);

            /**
             * Creates a new ErrorResponse instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ErrorResponse instance
             */
            public static create(properties?: telemetry.v1.IErrorResponse): telemetry.v1.ErrorResponse;

            /**
             * Encodes the specified ErrorResponse message. Does not implicitly {@link telemetry.v1.ErrorResponse.verify|verify} messages.
             * @param message ErrorResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: telemetry.v1.IErrorResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ErrorResponse message, length delimited. Does not implicitly {@link telemetry.v1.ErrorResponse.verify|verify} messages.
             * @param message ErrorResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: telemetry.v1.IErrorResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an ErrorResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ErrorResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.v1.ErrorResponse;

            /**
             * Decodes an ErrorResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ErrorResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.v1.ErrorResponse;

            /**
             * Verifies an ErrorResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an ErrorResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ErrorResponse
             */
            public static fromObject(object: { [k: string]: any }): telemetry.v1.ErrorResponse;

            /**
             * Creates a plain object from an ErrorResponse message. Also converts values to other types if specified.
             * @param message ErrorResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: telemetry.v1.ErrorResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ErrorResponse to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for ErrorResponse
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a HealthzResponse. */
        interface IHealthzResponse {

            /** HealthzResponse status */
            status?: (string|null);

            /** HealthzResponse timeUnixNano */
            timeUnixNano?: (number|Long|null);
        }

        /** Represents a HealthzResponse. */
        class HealthzResponse implements IHealthzResponse {

            /**
             * Constructs a new HealthzResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: telemetry.v1.IHealthzResponse);

            /** HealthzResponse status. */
            public status: string;

            /** HealthzResponse timeUnixNano. */
            public timeUnixNano: (number|Long);

            /**
             * Creates a new HealthzResponse instance using the specified properties.
             * @param [properties] Properties to set
             * @returns HealthzResponse instance
             */
            public static create(properties?: telemetry.v1.IHealthzResponse): telemetry.v1.HealthzResponse;

            /**
             * Encodes the specified HealthzResponse message. Does not implicitly {@link telemetry.v1.HealthzResponse.verify|verify} messages.
             * @param message HealthzResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: telemetry.v1.IHealthzResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified HealthzResponse message, length delimited. Does not implicitly {@link telemetry.v1.HealthzResponse.verify|verify} messages.
             * @param message HealthzResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: telemetry.v1.IHealthzResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a HealthzResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns HealthzResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.v1.HealthzResponse;

            /**
             * Decodes a HealthzResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns HealthzResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.v1.HealthzResponse;

            /**
             * Verifies a HealthzResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a HealthzResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns HealthzResponse
             */
            public static fromObject(object: { [k: string]: any }): telemetry.v1.HealthzResponse;

            /**
             * Creates a plain object from a HealthzResponse message. Also converts values to other types if specified.
             * @param message HealthzResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: telemetry.v1.HealthzResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this HealthzResponse to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for HealthzResponse
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a WSWelcome. */
        interface IWSWelcome {

            /** WSWelcome serverTimeUnixNano */
            serverTimeUnixNano?: (number|Long|null);

            /** WSWelcome nodes */
            nodes?: (string[]|null);

            /** WSWelcome categories */
            categories?: (string[]|null);
        }

        /** Represents a WSWelcome. */
        class WSWelcome implements IWSWelcome {

            /**
             * Constructs a new WSWelcome.
             * @param [properties] Properties to set
             */
            constructor(properties?: telemetry.v1.IWSWelcome);

            /** WSWelcome serverTimeUnixNano. */
            public serverTimeUnixNano: (number|Long);

            /** WSWelcome nodes. */
            public nodes: string[];

            /** WSWelcome categories. */
            public categories: string[];

            /**
             * Creates a new WSWelcome instance using the specified properties.
             * @param [properties] Properties to set
             * @returns WSWelcome instance
             */
            public static create(properties?: telemetry.v1.IWSWelcome): telemetry.v1.WSWelcome;

            /**
             * Encodes the specified WSWelcome message. Does not implicitly {@link telemetry.v1.WSWelcome.verify|verify} messages.
             * @param message WSWelcome message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: telemetry.v1.IWSWelcome, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified WSWelcome message, length delimited. Does not implicitly {@link telemetry.v1.WSWelcome.verify|verify} messages.
             * @param message WSWelcome message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: telemetry.v1.IWSWelcome, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a WSWelcome message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns WSWelcome
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.v1.WSWelcome;

            /**
             * Decodes a WSWelcome message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns WSWelcome
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.v1.WSWelcome;

            /**
             * Verifies a WSWelcome message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a WSWelcome message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns WSWelcome
             */
            public static fromObject(object: { [k: string]: any }): telemetry.v1.WSWelcome;

            /**
             * Creates a plain object from a WSWelcome message. Also converts values to other types if specified.
             * @param message WSWelcome
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: telemetry.v1.WSWelcome, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this WSWelcome to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for WSWelcome
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a WSClientControl. */
        interface IWSClientControl {

            /** WSClientControl op */
            op?: (string|null);

            /** WSClientControl nodes */
            nodes?: (string[]|null);

            /** WSClientControl categories */
            categories?: (string[]|null);
        }

        /** Represents a WSClientControl. */
        class WSClientControl implements IWSClientControl {

            /**
             * Constructs a new WSClientControl.
             * @param [properties] Properties to set
             */
            constructor(properties?: telemetry.v1.IWSClientControl);

            /** WSClientControl op. */
            public op: string;

            /** WSClientControl nodes. */
            public nodes: string[];

            /** WSClientControl categories. */
            public categories: string[];

            /**
             * Creates a new WSClientControl instance using the specified properties.
             * @param [properties] Properties to set
             * @returns WSClientControl instance
             */
            public static create(properties?: telemetry.v1.IWSClientControl): telemetry.v1.WSClientControl;

            /**
             * Encodes the specified WSClientControl message. Does not implicitly {@link telemetry.v1.WSClientControl.verify|verify} messages.
             * @param message WSClientControl message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: telemetry.v1.IWSClientControl, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified WSClientControl message, length delimited. Does not implicitly {@link telemetry.v1.WSClientControl.verify|verify} messages.
             * @param message WSClientControl message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: telemetry.v1.IWSClientControl, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a WSClientControl message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns WSClientControl
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.v1.WSClientControl;

            /**
             * Decodes a WSClientControl message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns WSClientControl
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.v1.WSClientControl;

            /**
             * Verifies a WSClientControl message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a WSClientControl message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns WSClientControl
             */
            public static fromObject(object: { [k: string]: any }): telemetry.v1.WSClientControl;

            /**
             * Creates a plain object from a WSClientControl message. Also converts values to other types if specified.
             * @param message WSClientControl
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: telemetry.v1.WSClientControl, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this WSClientControl to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for WSClientControl
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a WSOutgoingMessage. */
        interface IWSOutgoingMessage {

            /** WSOutgoingMessage type */
            type?: (string|null);

            /** WSOutgoingMessage metric */
            metric?: (telemetry.v1.ITimedSample|null);

            /** WSOutgoingMessage welcome */
            welcome?: (telemetry.v1.IWSWelcome|null);

            /** WSOutgoingMessage error */
            error?: (string|null);

            /** WSOutgoingMessage node */
            node?: (telemetry.v1.INodeSnapshot|null);
        }

        /** Represents a WSOutgoingMessage. */
        class WSOutgoingMessage implements IWSOutgoingMessage {

            /**
             * Constructs a new WSOutgoingMessage.
             * @param [properties] Properties to set
             */
            constructor(properties?: telemetry.v1.IWSOutgoingMessage);

            /** WSOutgoingMessage type. */
            public type: string;

            /** WSOutgoingMessage metric. */
            public metric?: (telemetry.v1.ITimedSample|null);

            /** WSOutgoingMessage welcome. */
            public welcome?: (telemetry.v1.IWSWelcome|null);

            /** WSOutgoingMessage error. */
            public error: string;

            /** WSOutgoingMessage node. */
            public node?: (telemetry.v1.INodeSnapshot|null);

            /**
             * Creates a new WSOutgoingMessage instance using the specified properties.
             * @param [properties] Properties to set
             * @returns WSOutgoingMessage instance
             */
            public static create(properties?: telemetry.v1.IWSOutgoingMessage): telemetry.v1.WSOutgoingMessage;

            /**
             * Encodes the specified WSOutgoingMessage message. Does not implicitly {@link telemetry.v1.WSOutgoingMessage.verify|verify} messages.
             * @param message WSOutgoingMessage message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: telemetry.v1.IWSOutgoingMessage, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified WSOutgoingMessage message, length delimited. Does not implicitly {@link telemetry.v1.WSOutgoingMessage.verify|verify} messages.
             * @param message WSOutgoingMessage message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: telemetry.v1.IWSOutgoingMessage, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a WSOutgoingMessage message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns WSOutgoingMessage
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.v1.WSOutgoingMessage;

            /**
             * Decodes a WSOutgoingMessage message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns WSOutgoingMessage
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.v1.WSOutgoingMessage;

            /**
             * Verifies a WSOutgoingMessage message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a WSOutgoingMessage message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns WSOutgoingMessage
             */
            public static fromObject(object: { [k: string]: any }): telemetry.v1.WSOutgoingMessage;

            /**
             * Creates a plain object from a WSOutgoingMessage message. Also converts values to other types if specified.
             * @param message WSOutgoingMessage
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: telemetry.v1.WSOutgoingMessage, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this WSOutgoingMessage to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for WSOutgoingMessage
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a BasicInfo. */
        interface IBasicInfo {

            /** BasicInfo hostname */
            hostname?: (string|null);

            /** BasicInfo ips */
            ips?: (string[]|null);

            /** BasicInfo os */
            os?: (string|null);

            /** BasicInfo kernel */
            kernel?: (string|null);

            /** BasicInfo arch */
            arch?: (string|null);

            /** BasicInfo machineId */
            machineId?: (string|null);

            /** BasicInfo bootId */
            bootId?: (string|null);

            /** BasicInfo hardwareModel */
            hardwareModel?: (string|null);

            /** BasicInfo hardwareVendor */
            hardwareVendor?: (string|null);
        }

        /** Represents a BasicInfo. */
        class BasicInfo implements IBasicInfo {

            /**
             * Constructs a new BasicInfo.
             * @param [properties] Properties to set
             */
            constructor(properties?: telemetry.v1.IBasicInfo);

            /** BasicInfo hostname. */
            public hostname: string;

            /** BasicInfo ips. */
            public ips: string[];

            /** BasicInfo os. */
            public os: string;

            /** BasicInfo kernel. */
            public kernel: string;

            /** BasicInfo arch. */
            public arch: string;

            /** BasicInfo machineId. */
            public machineId: string;

            /** BasicInfo bootId. */
            public bootId: string;

            /** BasicInfo hardwareModel. */
            public hardwareModel: string;

            /** BasicInfo hardwareVendor. */
            public hardwareVendor: string;

            /**
             * Creates a new BasicInfo instance using the specified properties.
             * @param [properties] Properties to set
             * @returns BasicInfo instance
             */
            public static create(properties?: telemetry.v1.IBasicInfo): telemetry.v1.BasicInfo;

            /**
             * Encodes the specified BasicInfo message. Does not implicitly {@link telemetry.v1.BasicInfo.verify|verify} messages.
             * @param message BasicInfo message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: telemetry.v1.IBasicInfo, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified BasicInfo message, length delimited. Does not implicitly {@link telemetry.v1.BasicInfo.verify|verify} messages.
             * @param message BasicInfo message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: telemetry.v1.IBasicInfo, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a BasicInfo message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns BasicInfo
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.v1.BasicInfo;

            /**
             * Decodes a BasicInfo message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns BasicInfo
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.v1.BasicInfo;

            /**
             * Verifies a BasicInfo message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a BasicInfo message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns BasicInfo
             */
            public static fromObject(object: { [k: string]: any }): telemetry.v1.BasicInfo;

            /**
             * Creates a plain object from a BasicInfo message. Also converts values to other types if specified.
             * @param message BasicInfo
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: telemetry.v1.BasicInfo, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this BasicInfo to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for BasicInfo
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a ModuleRegistration. */
        interface IModuleRegistration {

            /** ModuleRegistration name */
            name?: (string|null);

            /** ModuleRegistration cpu */
            cpu?: (telemetry.module.cpu.v1.IModuleRegistration|null);

            /** ModuleRegistration gpu */
            gpu?: (telemetry.module.gpu.v1.IModuleRegistration|null);

            /** ModuleRegistration memory */
            memory?: (telemetry.module.memory.v1.IModuleRegistration|null);

            /** ModuleRegistration storage */
            storage?: (telemetry.module.storage.v1.IModuleRegistration|null);

            /** ModuleRegistration network */
            network?: (telemetry.module.network.v1.IModuleRegistration|null);

            /** ModuleRegistration process */
            process?: (telemetry.module.process.v1.IModuleRegistration|null);
        }

        /** Represents a ModuleRegistration. */
        class ModuleRegistration implements IModuleRegistration {

            /**
             * Constructs a new ModuleRegistration.
             * @param [properties] Properties to set
             */
            constructor(properties?: telemetry.v1.IModuleRegistration);

            /** ModuleRegistration name. */
            public name: string;

            /** ModuleRegistration cpu. */
            public cpu?: (telemetry.module.cpu.v1.IModuleRegistration|null);

            /** ModuleRegistration gpu. */
            public gpu?: (telemetry.module.gpu.v1.IModuleRegistration|null);

            /** ModuleRegistration memory. */
            public memory?: (telemetry.module.memory.v1.IModuleRegistration|null);

            /** ModuleRegistration storage. */
            public storage?: (telemetry.module.storage.v1.IModuleRegistration|null);

            /** ModuleRegistration network. */
            public network?: (telemetry.module.network.v1.IModuleRegistration|null);

            /** ModuleRegistration process. */
            public process?: (telemetry.module.process.v1.IModuleRegistration|null);

            /** ModuleRegistration metadata. */
            public metadata?: ("cpu"|"gpu"|"memory"|"storage"|"network"|"process");

            /**
             * Creates a new ModuleRegistration instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ModuleRegistration instance
             */
            public static create(properties?: telemetry.v1.IModuleRegistration): telemetry.v1.ModuleRegistration;

            /**
             * Encodes the specified ModuleRegistration message. Does not implicitly {@link telemetry.v1.ModuleRegistration.verify|verify} messages.
             * @param message ModuleRegistration message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: telemetry.v1.IModuleRegistration, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ModuleRegistration message, length delimited. Does not implicitly {@link telemetry.v1.ModuleRegistration.verify|verify} messages.
             * @param message ModuleRegistration message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: telemetry.v1.IModuleRegistration, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ModuleRegistration message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ModuleRegistration
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.v1.ModuleRegistration;

            /**
             * Decodes a ModuleRegistration message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ModuleRegistration
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.v1.ModuleRegistration;

            /**
             * Verifies a ModuleRegistration message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ModuleRegistration message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ModuleRegistration
             */
            public static fromObject(object: { [k: string]: any }): telemetry.v1.ModuleRegistration;

            /**
             * Creates a plain object from a ModuleRegistration message. Also converts values to other types if specified.
             * @param message ModuleRegistration
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: telemetry.v1.ModuleRegistration, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ModuleRegistration to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for ModuleRegistration
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a Registration. */
        interface IRegistration {

            /** Registration nodeId */
            nodeId?: (string|null);

            /** Registration basic */
            basic?: (telemetry.v1.IBasicInfo|null);

            /** Registration modules */
            modules?: (telemetry.v1.IModuleRegistration[]|null);

            /** Registration atUnixNano */
            atUnixNano?: (number|Long|null);
        }

        /** Represents a Registration. */
        class Registration implements IRegistration {

            /**
             * Constructs a new Registration.
             * @param [properties] Properties to set
             */
            constructor(properties?: telemetry.v1.IRegistration);

            /** Registration nodeId. */
            public nodeId: string;

            /** Registration basic. */
            public basic?: (telemetry.v1.IBasicInfo|null);

            /** Registration modules. */
            public modules: telemetry.v1.IModuleRegistration[];

            /** Registration atUnixNano. */
            public atUnixNano: (number|Long);

            /**
             * Creates a new Registration instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Registration instance
             */
            public static create(properties?: telemetry.v1.IRegistration): telemetry.v1.Registration;

            /**
             * Encodes the specified Registration message. Does not implicitly {@link telemetry.v1.Registration.verify|verify} messages.
             * @param message Registration message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: telemetry.v1.IRegistration, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Registration message, length delimited. Does not implicitly {@link telemetry.v1.Registration.verify|verify} messages.
             * @param message Registration message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: telemetry.v1.IRegistration, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Registration message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Registration
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.v1.Registration;

            /**
             * Decodes a Registration message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Registration
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.v1.Registration;

            /**
             * Verifies a Registration message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Registration message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Registration
             */
            public static fromObject(object: { [k: string]: any }): telemetry.v1.Registration;

            /**
             * Creates a plain object from a Registration message. Also converts values to other types if specified.
             * @param message Registration
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: telemetry.v1.Registration, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Registration to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for Registration
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a Heartbeat. */
        interface IHeartbeat {

            /** Heartbeat nodeId */
            nodeId?: (string|null);

            /** Heartbeat atUnixNano */
            atUnixNano?: (number|Long|null);
        }

        /** Represents a Heartbeat. */
        class Heartbeat implements IHeartbeat {

            /**
             * Constructs a new Heartbeat.
             * @param [properties] Properties to set
             */
            constructor(properties?: telemetry.v1.IHeartbeat);

            /** Heartbeat nodeId. */
            public nodeId: string;

            /** Heartbeat atUnixNano. */
            public atUnixNano: (number|Long);

            /**
             * Creates a new Heartbeat instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Heartbeat instance
             */
            public static create(properties?: telemetry.v1.IHeartbeat): telemetry.v1.Heartbeat;

            /**
             * Encodes the specified Heartbeat message. Does not implicitly {@link telemetry.v1.Heartbeat.verify|verify} messages.
             * @param message Heartbeat message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: telemetry.v1.IHeartbeat, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Heartbeat message, length delimited. Does not implicitly {@link telemetry.v1.Heartbeat.verify|verify} messages.
             * @param message Heartbeat message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: telemetry.v1.IHeartbeat, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Heartbeat message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Heartbeat
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.v1.Heartbeat;

            /**
             * Decodes a Heartbeat message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Heartbeat
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.v1.Heartbeat;

            /**
             * Verifies a Heartbeat message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Heartbeat message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Heartbeat
             */
            public static fromObject(object: { [k: string]: any }): telemetry.v1.Heartbeat;

            /**
             * Creates a plain object from a Heartbeat message. Also converts values to other types if specified.
             * @param message Heartbeat
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: telemetry.v1.Heartbeat, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Heartbeat to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for Heartbeat
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a MetricSample. */
        interface IMetricSample {

            /** MetricSample category */
            category?: (string|null);

            /** MetricSample atUnixNano */
            atUnixNano?: (number|Long|null);

            /** MetricSample cpuUltraMetrics */
            cpuUltraMetrics?: (telemetry.module.cpu.v1.IUltraMetrics|null);

            /** MetricSample cpuMediumMetrics */
            cpuMediumMetrics?: (telemetry.module.cpu.v1.IMediumMetrics|null);

            /** MetricSample gpuFastMetrics */
            gpuFastMetrics?: (telemetry.module.gpu.v1.IFastMetrics|null);

            /** MetricSample memoryMetrics */
            memoryMetrics?: (telemetry.module.memory.v1.IMetrics|null);

            /** MetricSample storageMetrics */
            storageMetrics?: (telemetry.module.storage.v1.IMetrics|null);

            /** MetricSample networkMetrics */
            networkMetrics?: (telemetry.module.network.v1.IMetrics|null);

            /** MetricSample processMetrics */
            processMetrics?: (telemetry.module.process.v1.IMetrics|null);
        }

        /** Represents a MetricSample. */
        class MetricSample implements IMetricSample {

            /**
             * Constructs a new MetricSample.
             * @param [properties] Properties to set
             */
            constructor(properties?: telemetry.v1.IMetricSample);

            /** MetricSample category. */
            public category: string;

            /** MetricSample atUnixNano. */
            public atUnixNano: (number|Long);

            /** MetricSample cpuUltraMetrics. */
            public cpuUltraMetrics?: (telemetry.module.cpu.v1.IUltraMetrics|null);

            /** MetricSample cpuMediumMetrics. */
            public cpuMediumMetrics?: (telemetry.module.cpu.v1.IMediumMetrics|null);

            /** MetricSample gpuFastMetrics. */
            public gpuFastMetrics?: (telemetry.module.gpu.v1.IFastMetrics|null);

            /** MetricSample memoryMetrics. */
            public memoryMetrics?: (telemetry.module.memory.v1.IMetrics|null);

            /** MetricSample storageMetrics. */
            public storageMetrics?: (telemetry.module.storage.v1.IMetrics|null);

            /** MetricSample networkMetrics. */
            public networkMetrics?: (telemetry.module.network.v1.IMetrics|null);

            /** MetricSample processMetrics. */
            public processMetrics?: (telemetry.module.process.v1.IMetrics|null);

            /** MetricSample payload. */
            public payload?: ("cpuUltraMetrics"|"cpuMediumMetrics"|"gpuFastMetrics"|"memoryMetrics"|"storageMetrics"|"networkMetrics"|"processMetrics");

            /**
             * Creates a new MetricSample instance using the specified properties.
             * @param [properties] Properties to set
             * @returns MetricSample instance
             */
            public static create(properties?: telemetry.v1.IMetricSample): telemetry.v1.MetricSample;

            /**
             * Encodes the specified MetricSample message. Does not implicitly {@link telemetry.v1.MetricSample.verify|verify} messages.
             * @param message MetricSample message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: telemetry.v1.IMetricSample, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified MetricSample message, length delimited. Does not implicitly {@link telemetry.v1.MetricSample.verify|verify} messages.
             * @param message MetricSample message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: telemetry.v1.IMetricSample, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a MetricSample message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns MetricSample
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.v1.MetricSample;

            /**
             * Decodes a MetricSample message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns MetricSample
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.v1.MetricSample;

            /**
             * Verifies a MetricSample message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a MetricSample message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns MetricSample
             */
            public static fromObject(object: { [k: string]: any }): telemetry.v1.MetricSample;

            /**
             * Creates a plain object from a MetricSample message. Also converts values to other types if specified.
             * @param message MetricSample
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: telemetry.v1.MetricSample, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this MetricSample to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for MetricSample
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a MetricsBatch. */
        interface IMetricsBatch {

            /** MetricsBatch nodeId */
            nodeId?: (string|null);

            /** MetricsBatch samples */
            samples?: (telemetry.v1.IMetricSample[]|null);

            /** MetricsBatch sentAtUnixNano */
            sentAtUnixNano?: (number|Long|null);
        }

        /** Represents a MetricsBatch. */
        class MetricsBatch implements IMetricsBatch {

            /**
             * Constructs a new MetricsBatch.
             * @param [properties] Properties to set
             */
            constructor(properties?: telemetry.v1.IMetricsBatch);

            /** MetricsBatch nodeId. */
            public nodeId: string;

            /** MetricsBatch samples. */
            public samples: telemetry.v1.IMetricSample[];

            /** MetricsBatch sentAtUnixNano. */
            public sentAtUnixNano: (number|Long);

            /**
             * Creates a new MetricsBatch instance using the specified properties.
             * @param [properties] Properties to set
             * @returns MetricsBatch instance
             */
            public static create(properties?: telemetry.v1.IMetricsBatch): telemetry.v1.MetricsBatch;

            /**
             * Encodes the specified MetricsBatch message. Does not implicitly {@link telemetry.v1.MetricsBatch.verify|verify} messages.
             * @param message MetricsBatch message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: telemetry.v1.IMetricsBatch, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified MetricsBatch message, length delimited. Does not implicitly {@link telemetry.v1.MetricsBatch.verify|verify} messages.
             * @param message MetricsBatch message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: telemetry.v1.IMetricsBatch, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a MetricsBatch message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns MetricsBatch
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.v1.MetricsBatch;

            /**
             * Decodes a MetricsBatch message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns MetricsBatch
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.v1.MetricsBatch;

            /**
             * Verifies a MetricsBatch message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a MetricsBatch message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns MetricsBatch
             */
            public static fromObject(object: { [k: string]: any }): telemetry.v1.MetricsBatch;

            /**
             * Creates a plain object from a MetricsBatch message. Also converts values to other types if specified.
             * @param message MetricsBatch
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: telemetry.v1.MetricsBatch, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this MetricsBatch to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for MetricsBatch
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a Command. */
        interface ICommand {

            /** Command id */
            id?: (string|null);

            /** Command nodeId */
            nodeId?: (string|null);

            /** Command type */
            type?: (string|null);

            /** Command issuedAtUnixNano */
            issuedAtUnixNano?: (number|Long|null);

            /** Command cpuScalingRange */
            cpuScalingRange?: (telemetry.module.cpu.v1.IScalingRangeCommand|null);

            /** Command cpuGovernor */
            cpuGovernor?: (telemetry.module.cpu.v1.IGovernorCommand|null);

            /** Command cpuUncoreRange */
            cpuUncoreRange?: (telemetry.module.cpu.v1.IUncoreRangeCommand|null);

            /** Command cpuPowerCap */
            cpuPowerCap?: (telemetry.module.cpu.v1.IPowerCapCommand|null);

            /** Command gpuClockRange */
            gpuClockRange?: (telemetry.module.gpu.v1.IClockRangeCommand|null);

            /** Command gpuPowerCap */
            gpuPowerCap?: (telemetry.module.gpu.v1.IPowerCapCommand|null);

            /** Command processSignal */
            processSignal?: (telemetry.module.process.v1.ISignalCommand|null);
        }

        /** Represents a Command. */
        class Command implements ICommand {

            /**
             * Constructs a new Command.
             * @param [properties] Properties to set
             */
            constructor(properties?: telemetry.v1.ICommand);

            /** Command id. */
            public id: string;

            /** Command nodeId. */
            public nodeId: string;

            /** Command type. */
            public type: string;

            /** Command issuedAtUnixNano. */
            public issuedAtUnixNano: (number|Long);

            /** Command cpuScalingRange. */
            public cpuScalingRange?: (telemetry.module.cpu.v1.IScalingRangeCommand|null);

            /** Command cpuGovernor. */
            public cpuGovernor?: (telemetry.module.cpu.v1.IGovernorCommand|null);

            /** Command cpuUncoreRange. */
            public cpuUncoreRange?: (telemetry.module.cpu.v1.IUncoreRangeCommand|null);

            /** Command cpuPowerCap. */
            public cpuPowerCap?: (telemetry.module.cpu.v1.IPowerCapCommand|null);

            /** Command gpuClockRange. */
            public gpuClockRange?: (telemetry.module.gpu.v1.IClockRangeCommand|null);

            /** Command gpuPowerCap. */
            public gpuPowerCap?: (telemetry.module.gpu.v1.IPowerCapCommand|null);

            /** Command processSignal. */
            public processSignal?: (telemetry.module.process.v1.ISignalCommand|null);

            /** Command payload. */
            public payload?: ("cpuScalingRange"|"cpuGovernor"|"cpuUncoreRange"|"cpuPowerCap"|"gpuClockRange"|"gpuPowerCap"|"processSignal");

            /**
             * Creates a new Command instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Command instance
             */
            public static create(properties?: telemetry.v1.ICommand): telemetry.v1.Command;

            /**
             * Encodes the specified Command message. Does not implicitly {@link telemetry.v1.Command.verify|verify} messages.
             * @param message Command message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: telemetry.v1.ICommand, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Command message, length delimited. Does not implicitly {@link telemetry.v1.Command.verify|verify} messages.
             * @param message Command message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: telemetry.v1.ICommand, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Command message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Command
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.v1.Command;

            /**
             * Decodes a Command message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Command
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.v1.Command;

            /**
             * Verifies a Command message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Command message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Command
             */
            public static fromObject(object: { [k: string]: any }): telemetry.v1.Command;

            /**
             * Creates a plain object from a Command message. Also converts values to other types if specified.
             * @param message Command
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: telemetry.v1.Command, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Command to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for Command
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a CommandResult. */
        interface ICommandResult {

            /** CommandResult commandId */
            commandId?: (string|null);

            /** CommandResult nodeId */
            nodeId?: (string|null);

            /** CommandResult type */
            type?: (string|null);

            /** CommandResult success */
            success?: (boolean|null);

            /** CommandResult error */
            error?: (string|null);

            /** CommandResult finishedAtUnixNano */
            finishedAtUnixNano?: (number|Long|null);
        }

        /** Represents a CommandResult. */
        class CommandResult implements ICommandResult {

            /**
             * Constructs a new CommandResult.
             * @param [properties] Properties to set
             */
            constructor(properties?: telemetry.v1.ICommandResult);

            /** CommandResult commandId. */
            public commandId: string;

            /** CommandResult nodeId. */
            public nodeId: string;

            /** CommandResult type. */
            public type: string;

            /** CommandResult success. */
            public success: boolean;

            /** CommandResult error. */
            public error: string;

            /** CommandResult finishedAtUnixNano. */
            public finishedAtUnixNano: (number|Long);

            /**
             * Creates a new CommandResult instance using the specified properties.
             * @param [properties] Properties to set
             * @returns CommandResult instance
             */
            public static create(properties?: telemetry.v1.ICommandResult): telemetry.v1.CommandResult;

            /**
             * Encodes the specified CommandResult message. Does not implicitly {@link telemetry.v1.CommandResult.verify|verify} messages.
             * @param message CommandResult message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: telemetry.v1.ICommandResult, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified CommandResult message, length delimited. Does not implicitly {@link telemetry.v1.CommandResult.verify|verify} messages.
             * @param message CommandResult message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: telemetry.v1.ICommandResult, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a CommandResult message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns CommandResult
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.v1.CommandResult;

            /**
             * Decodes a CommandResult message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns CommandResult
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.v1.CommandResult;

            /**
             * Verifies a CommandResult message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a CommandResult message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns CommandResult
             */
            public static fromObject(object: { [k: string]: any }): telemetry.v1.CommandResult;

            /**
             * Creates a plain object from a CommandResult message. Also converts values to other types if specified.
             * @param message CommandResult
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: telemetry.v1.CommandResult, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this CommandResult to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for CommandResult
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a ServerAck. */
        interface IServerAck {

            /** ServerAck nodeId */
            nodeId?: (string|null);

            /** ServerAck atUnixNano */
            atUnixNano?: (number|Long|null);
        }

        /** Represents a ServerAck. */
        class ServerAck implements IServerAck {

            /**
             * Constructs a new ServerAck.
             * @param [properties] Properties to set
             */
            constructor(properties?: telemetry.v1.IServerAck);

            /** ServerAck nodeId. */
            public nodeId: string;

            /** ServerAck atUnixNano. */
            public atUnixNano: (number|Long);

            /**
             * Creates a new ServerAck instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ServerAck instance
             */
            public static create(properties?: telemetry.v1.IServerAck): telemetry.v1.ServerAck;

            /**
             * Encodes the specified ServerAck message. Does not implicitly {@link telemetry.v1.ServerAck.verify|verify} messages.
             * @param message ServerAck message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: telemetry.v1.IServerAck, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ServerAck message, length delimited. Does not implicitly {@link telemetry.v1.ServerAck.verify|verify} messages.
             * @param message ServerAck message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: telemetry.v1.IServerAck, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ServerAck message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ServerAck
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.v1.ServerAck;

            /**
             * Decodes a ServerAck message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ServerAck
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.v1.ServerAck;

            /**
             * Verifies a ServerAck message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ServerAck message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ServerAck
             */
            public static fromObject(object: { [k: string]: any }): telemetry.v1.ServerAck;

            /**
             * Creates a plain object from a ServerAck message. Also converts values to other types if specified.
             * @param message ServerAck
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: telemetry.v1.ServerAck, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ServerAck to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for ServerAck
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of an AgentMessage. */
        interface IAgentMessage {

            /** AgentMessage kind */
            kind?: (string|null);

            /** AgentMessage registration */
            registration?: (telemetry.v1.IRegistration|null);

            /** AgentMessage metrics */
            metrics?: (telemetry.v1.IMetricsBatch|null);

            /** AgentMessage result */
            result?: (telemetry.v1.ICommandResult|null);

            /** AgentMessage heartbeat */
            heartbeat?: (telemetry.v1.IHeartbeat|null);
        }

        /** Represents an AgentMessage. */
        class AgentMessage implements IAgentMessage {

            /**
             * Constructs a new AgentMessage.
             * @param [properties] Properties to set
             */
            constructor(properties?: telemetry.v1.IAgentMessage);

            /** AgentMessage kind. */
            public kind: string;

            /** AgentMessage registration. */
            public registration?: (telemetry.v1.IRegistration|null);

            /** AgentMessage metrics. */
            public metrics?: (telemetry.v1.IMetricsBatch|null);

            /** AgentMessage result. */
            public result?: (telemetry.v1.ICommandResult|null);

            /** AgentMessage heartbeat. */
            public heartbeat?: (telemetry.v1.IHeartbeat|null);

            /**
             * Creates a new AgentMessage instance using the specified properties.
             * @param [properties] Properties to set
             * @returns AgentMessage instance
             */
            public static create(properties?: telemetry.v1.IAgentMessage): telemetry.v1.AgentMessage;

            /**
             * Encodes the specified AgentMessage message. Does not implicitly {@link telemetry.v1.AgentMessage.verify|verify} messages.
             * @param message AgentMessage message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: telemetry.v1.IAgentMessage, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified AgentMessage message, length delimited. Does not implicitly {@link telemetry.v1.AgentMessage.verify|verify} messages.
             * @param message AgentMessage message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: telemetry.v1.IAgentMessage, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an AgentMessage message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns AgentMessage
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.v1.AgentMessage;

            /**
             * Decodes an AgentMessage message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns AgentMessage
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.v1.AgentMessage;

            /**
             * Verifies an AgentMessage message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an AgentMessage message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns AgentMessage
             */
            public static fromObject(object: { [k: string]: any }): telemetry.v1.AgentMessage;

            /**
             * Creates a plain object from an AgentMessage message. Also converts values to other types if specified.
             * @param message AgentMessage
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: telemetry.v1.AgentMessage, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this AgentMessage to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for AgentMessage
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a ServerMessage. */
        interface IServerMessage {

            /** ServerMessage kind */
            kind?: (string|null);

            /** ServerMessage command */
            command?: (telemetry.v1.ICommand|null);

            /** ServerMessage ack */
            ack?: (telemetry.v1.IServerAck|null);
        }

        /** Represents a ServerMessage. */
        class ServerMessage implements IServerMessage {

            /**
             * Constructs a new ServerMessage.
             * @param [properties] Properties to set
             */
            constructor(properties?: telemetry.v1.IServerMessage);

            /** ServerMessage kind. */
            public kind: string;

            /** ServerMessage command. */
            public command?: (telemetry.v1.ICommand|null);

            /** ServerMessage ack. */
            public ack?: (telemetry.v1.IServerAck|null);

            /**
             * Creates a new ServerMessage instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ServerMessage instance
             */
            public static create(properties?: telemetry.v1.IServerMessage): telemetry.v1.ServerMessage;

            /**
             * Encodes the specified ServerMessage message. Does not implicitly {@link telemetry.v1.ServerMessage.verify|verify} messages.
             * @param message ServerMessage message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: telemetry.v1.IServerMessage, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ServerMessage message, length delimited. Does not implicitly {@link telemetry.v1.ServerMessage.verify|verify} messages.
             * @param message ServerMessage message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: telemetry.v1.IServerMessage, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ServerMessage message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ServerMessage
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.v1.ServerMessage;

            /**
             * Decodes a ServerMessage message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ServerMessage
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.v1.ServerMessage;

            /**
             * Verifies a ServerMessage message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ServerMessage message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ServerMessage
             */
            public static fromObject(object: { [k: string]: any }): telemetry.v1.ServerMessage;

            /**
             * Creates a plain object from a ServerMessage message. Also converts values to other types if specified.
             * @param message ServerMessage
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: telemetry.v1.ServerMessage, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ServerMessage to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for ServerMessage
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Represents a TelemetryService */
        class TelemetryService extends $protobuf.rpc.Service {

            /**
             * Constructs a new TelemetryService service.
             * @param rpcImpl RPC implementation
             * @param [requestDelimited=false] Whether requests are length-delimited
             * @param [responseDelimited=false] Whether responses are length-delimited
             */
            constructor(rpcImpl: $protobuf.RPCImpl, requestDelimited?: boolean, responseDelimited?: boolean);

            /**
             * Creates new TelemetryService service using the specified rpc implementation.
             * @param rpcImpl RPC implementation
             * @param [requestDelimited=false] Whether requests are length-delimited
             * @param [responseDelimited=false] Whether responses are length-delimited
             * @returns RPC service. Useful where requests and/or responses are streamed.
             */
            public static create(rpcImpl: $protobuf.RPCImpl, requestDelimited?: boolean, responseDelimited?: boolean): TelemetryService;

            /**
             * Calls StreamTelemetry.
             * @param request AgentMessage message or plain object
             * @param callback Node-style callback called with the error, if any, and ServerMessage
             */
            public streamTelemetry(request: telemetry.v1.IAgentMessage, callback: telemetry.v1.TelemetryService.StreamTelemetryCallback): void;

            /**
             * Calls StreamTelemetry.
             * @param request AgentMessage message or plain object
             * @returns Promise
             */
            public streamTelemetry(request: telemetry.v1.IAgentMessage): Promise<telemetry.v1.ServerMessage>;
        }

        namespace TelemetryService {

            /**
             * Callback as used by {@link telemetry.v1.TelemetryService#streamTelemetry}.
             * @param error Error, if any
             * @param [response] ServerMessage
             */
            type StreamTelemetryCallback = (error: (Error|null), response?: telemetry.v1.ServerMessage) => void;
        }
    }

    /** Namespace module. */
    namespace module {

        /** Namespace cpu. */
        namespace cpu {

            /** Namespace v1. */
            namespace v1 {

                /** Properties of a CollectorSpec. */
                interface ICollectorSpec {

                    /** CollectorSpec category */
                    category?: (string|null);

                    /** CollectorSpec interval */
                    interval?: (string|null);
                }

                /** Represents a CollectorSpec. */
                class CollectorSpec implements ICollectorSpec {

                    /**
                     * Constructs a new CollectorSpec.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: telemetry.module.cpu.v1.ICollectorSpec);

                    /** CollectorSpec category. */
                    public category: string;

                    /** CollectorSpec interval. */
                    public interval: string;

                    /**
                     * Creates a new CollectorSpec instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns CollectorSpec instance
                     */
                    public static create(properties?: telemetry.module.cpu.v1.ICollectorSpec): telemetry.module.cpu.v1.CollectorSpec;

                    /**
                     * Encodes the specified CollectorSpec message. Does not implicitly {@link telemetry.module.cpu.v1.CollectorSpec.verify|verify} messages.
                     * @param message CollectorSpec message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: telemetry.module.cpu.v1.ICollectorSpec, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified CollectorSpec message, length delimited. Does not implicitly {@link telemetry.module.cpu.v1.CollectorSpec.verify|verify} messages.
                     * @param message CollectorSpec message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: telemetry.module.cpu.v1.ICollectorSpec, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a CollectorSpec message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns CollectorSpec
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.module.cpu.v1.CollectorSpec;

                    /**
                     * Decodes a CollectorSpec message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns CollectorSpec
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.module.cpu.v1.CollectorSpec;

                    /**
                     * Verifies a CollectorSpec message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a CollectorSpec message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns CollectorSpec
                     */
                    public static fromObject(object: { [k: string]: any }): telemetry.module.cpu.v1.CollectorSpec;

                    /**
                     * Creates a plain object from a CollectorSpec message. Also converts values to other types if specified.
                     * @param message CollectorSpec
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: telemetry.module.cpu.v1.CollectorSpec, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this CollectorSpec to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };

                    /**
                     * Gets the default type url for CollectorSpec
                     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns The default type url
                     */
                    public static getTypeUrl(typeUrlPrefix?: string): string;
                }

                /** Properties of a ControllerSpec. */
                interface IControllerSpec {

                    /** ControllerSpec type */
                    type?: (string|null);
                }

                /** Represents a ControllerSpec. */
                class ControllerSpec implements IControllerSpec {

                    /**
                     * Constructs a new ControllerSpec.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: telemetry.module.cpu.v1.IControllerSpec);

                    /** ControllerSpec type. */
                    public type: string;

                    /**
                     * Creates a new ControllerSpec instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns ControllerSpec instance
                     */
                    public static create(properties?: telemetry.module.cpu.v1.IControllerSpec): telemetry.module.cpu.v1.ControllerSpec;

                    /**
                     * Encodes the specified ControllerSpec message. Does not implicitly {@link telemetry.module.cpu.v1.ControllerSpec.verify|verify} messages.
                     * @param message ControllerSpec message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: telemetry.module.cpu.v1.IControllerSpec, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified ControllerSpec message, length delimited. Does not implicitly {@link telemetry.module.cpu.v1.ControllerSpec.verify|verify} messages.
                     * @param message ControllerSpec message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: telemetry.module.cpu.v1.IControllerSpec, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a ControllerSpec message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns ControllerSpec
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.module.cpu.v1.ControllerSpec;

                    /**
                     * Decodes a ControllerSpec message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns ControllerSpec
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.module.cpu.v1.ControllerSpec;

                    /**
                     * Verifies a ControllerSpec message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a ControllerSpec message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns ControllerSpec
                     */
                    public static fromObject(object: { [k: string]: any }): telemetry.module.cpu.v1.ControllerSpec;

                    /**
                     * Creates a plain object from a ControllerSpec message. Also converts values to other types if specified.
                     * @param message ControllerSpec
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: telemetry.module.cpu.v1.ControllerSpec, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this ControllerSpec to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };

                    /**
                     * Gets the default type url for ControllerSpec
                     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns The default type url
                     */
                    public static getTypeUrl(typeUrlPrefix?: string): string;
                }

                /** Properties of a CpuDevice. */
                interface ICpuDevice {

                    /** CpuDevice packageId */
                    packageId?: (number|null);

                    /** CpuDevice coreIds */
                    coreIds?: (number[]|null);

                    /** CpuDevice coreCount */
                    coreCount?: (number|null);

                    /** CpuDevice threadCount */
                    threadCount?: (number|null);

                    /** CpuDevice vendor */
                    vendor?: (string|null);

                    /** CpuDevice model */
                    model?: (string|null);
                }

                /** Represents a CpuDevice. */
                class CpuDevice implements ICpuDevice {

                    /**
                     * Constructs a new CpuDevice.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: telemetry.module.cpu.v1.ICpuDevice);

                    /** CpuDevice packageId. */
                    public packageId: number;

                    /** CpuDevice coreIds. */
                    public coreIds: number[];

                    /** CpuDevice coreCount. */
                    public coreCount: number;

                    /** CpuDevice threadCount. */
                    public threadCount: number;

                    /** CpuDevice vendor. */
                    public vendor: string;

                    /** CpuDevice model. */
                    public model: string;

                    /**
                     * Creates a new CpuDevice instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns CpuDevice instance
                     */
                    public static create(properties?: telemetry.module.cpu.v1.ICpuDevice): telemetry.module.cpu.v1.CpuDevice;

                    /**
                     * Encodes the specified CpuDevice message. Does not implicitly {@link telemetry.module.cpu.v1.CpuDevice.verify|verify} messages.
                     * @param message CpuDevice message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: telemetry.module.cpu.v1.ICpuDevice, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified CpuDevice message, length delimited. Does not implicitly {@link telemetry.module.cpu.v1.CpuDevice.verify|verify} messages.
                     * @param message CpuDevice message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: telemetry.module.cpu.v1.ICpuDevice, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a CpuDevice message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns CpuDevice
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.module.cpu.v1.CpuDevice;

                    /**
                     * Decodes a CpuDevice message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns CpuDevice
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.module.cpu.v1.CpuDevice;

                    /**
                     * Verifies a CpuDevice message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a CpuDevice message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns CpuDevice
                     */
                    public static fromObject(object: { [k: string]: any }): telemetry.module.cpu.v1.CpuDevice;

                    /**
                     * Creates a plain object from a CpuDevice message. Also converts values to other types if specified.
                     * @param message CpuDevice
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: telemetry.module.cpu.v1.CpuDevice, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this CpuDevice to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };

                    /**
                     * Gets the default type url for CpuDevice
                     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns The default type url
                     */
                    public static getTypeUrl(typeUrlPrefix?: string): string;
                }

                /** Properties of a StaticInfo. */
                interface IStaticInfo {

                    /** StaticInfo vendor */
                    vendor?: (string|null);

                    /** StaticInfo model */
                    model?: (string|null);

                    /** StaticInfo packages */
                    packages?: (number|null);

                    /** StaticInfo physicalCores */
                    physicalCores?: (number|null);

                    /** StaticInfo logicalCores */
                    logicalCores?: (number|null);

                    /** StaticInfo threadsPerCore */
                    threadsPerCore?: (number|null);

                    /** StaticInfo cpuinfoMinKhz */
                    cpuinfoMinKhz?: (number|Long|null);

                    /** StaticInfo cpuinfoMaxKhz */
                    cpuinfoMaxKhz?: (number|Long|null);

                    /** StaticInfo supportsIntelUncore */
                    supportsIntelUncore?: (boolean|null);

                    /** StaticInfo supportsRapl */
                    supportsRapl?: (boolean|null);
                }

                /** Represents a StaticInfo. */
                class StaticInfo implements IStaticInfo {

                    /**
                     * Constructs a new StaticInfo.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: telemetry.module.cpu.v1.IStaticInfo);

                    /** StaticInfo vendor. */
                    public vendor: string;

                    /** StaticInfo model. */
                    public model: string;

                    /** StaticInfo packages. */
                    public packages: number;

                    /** StaticInfo physicalCores. */
                    public physicalCores: number;

                    /** StaticInfo logicalCores. */
                    public logicalCores: number;

                    /** StaticInfo threadsPerCore. */
                    public threadsPerCore: number;

                    /** StaticInfo cpuinfoMinKhz. */
                    public cpuinfoMinKhz: (number|Long);

                    /** StaticInfo cpuinfoMaxKhz. */
                    public cpuinfoMaxKhz: (number|Long);

                    /** StaticInfo supportsIntelUncore. */
                    public supportsIntelUncore: boolean;

                    /** StaticInfo supportsRapl. */
                    public supportsRapl: boolean;

                    /**
                     * Creates a new StaticInfo instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns StaticInfo instance
                     */
                    public static create(properties?: telemetry.module.cpu.v1.IStaticInfo): telemetry.module.cpu.v1.StaticInfo;

                    /**
                     * Encodes the specified StaticInfo message. Does not implicitly {@link telemetry.module.cpu.v1.StaticInfo.verify|verify} messages.
                     * @param message StaticInfo message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: telemetry.module.cpu.v1.IStaticInfo, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified StaticInfo message, length delimited. Does not implicitly {@link telemetry.module.cpu.v1.StaticInfo.verify|verify} messages.
                     * @param message StaticInfo message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: telemetry.module.cpu.v1.IStaticInfo, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a StaticInfo message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns StaticInfo
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.module.cpu.v1.StaticInfo;

                    /**
                     * Decodes a StaticInfo message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns StaticInfo
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.module.cpu.v1.StaticInfo;

                    /**
                     * Verifies a StaticInfo message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a StaticInfo message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns StaticInfo
                     */
                    public static fromObject(object: { [k: string]: any }): telemetry.module.cpu.v1.StaticInfo;

                    /**
                     * Creates a plain object from a StaticInfo message. Also converts values to other types if specified.
                     * @param message StaticInfo
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: telemetry.module.cpu.v1.StaticInfo, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this StaticInfo to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };

                    /**
                     * Gets the default type url for StaticInfo
                     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns The default type url
                     */
                    public static getTypeUrl(typeUrlPrefix?: string): string;
                }

                /** Properties of a ModuleRegistration. */
                interface IModuleRegistration {

                    /** ModuleRegistration static */
                    "static"?: (telemetry.module.cpu.v1.IStaticInfo|null);

                    /** ModuleRegistration collectors */
                    collectors?: (telemetry.module.cpu.v1.ICollectorSpec[]|null);

                    /** ModuleRegistration controllers */
                    controllers?: (telemetry.module.cpu.v1.IControllerSpec[]|null);

                    /** ModuleRegistration devices */
                    devices?: (telemetry.module.cpu.v1.ICpuDevice[]|null);

                    /** ModuleRegistration packageControls */
                    packageControls?: (telemetry.module.cpu.v1.IPackageControl[]|null);
                }

                /** Represents a ModuleRegistration. */
                class ModuleRegistration implements IModuleRegistration {

                    /**
                     * Constructs a new ModuleRegistration.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: telemetry.module.cpu.v1.IModuleRegistration);

                    /** ModuleRegistration static. */
                    public static?: (telemetry.module.cpu.v1.IStaticInfo|null);

                    /** ModuleRegistration collectors. */
                    public collectors: telemetry.module.cpu.v1.ICollectorSpec[];

                    /** ModuleRegistration controllers. */
                    public controllers: telemetry.module.cpu.v1.IControllerSpec[];

                    /** ModuleRegistration devices. */
                    public devices: telemetry.module.cpu.v1.ICpuDevice[];

                    /** ModuleRegistration packageControls. */
                    public packageControls: telemetry.module.cpu.v1.IPackageControl[];

                    /**
                     * Creates a new ModuleRegistration instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns ModuleRegistration instance
                     */
                    public static create(properties?: telemetry.module.cpu.v1.IModuleRegistration): telemetry.module.cpu.v1.ModuleRegistration;

                    /**
                     * Encodes the specified ModuleRegistration message. Does not implicitly {@link telemetry.module.cpu.v1.ModuleRegistration.verify|verify} messages.
                     * @param message ModuleRegistration message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: telemetry.module.cpu.v1.IModuleRegistration, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified ModuleRegistration message, length delimited. Does not implicitly {@link telemetry.module.cpu.v1.ModuleRegistration.verify|verify} messages.
                     * @param message ModuleRegistration message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: telemetry.module.cpu.v1.IModuleRegistration, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a ModuleRegistration message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns ModuleRegistration
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.module.cpu.v1.ModuleRegistration;

                    /**
                     * Decodes a ModuleRegistration message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns ModuleRegistration
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.module.cpu.v1.ModuleRegistration;

                    /**
                     * Verifies a ModuleRegistration message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a ModuleRegistration message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns ModuleRegistration
                     */
                    public static fromObject(object: { [k: string]: any }): telemetry.module.cpu.v1.ModuleRegistration;

                    /**
                     * Creates a plain object from a ModuleRegistration message. Also converts values to other types if specified.
                     * @param message ModuleRegistration
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: telemetry.module.cpu.v1.ModuleRegistration, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this ModuleRegistration to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };

                    /**
                     * Gets the default type url for ModuleRegistration
                     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns The default type url
                     */
                    public static getTypeUrl(typeUrlPrefix?: string): string;
                }

                /** Properties of a PackageControl. */
                interface IPackageControl {

                    /** PackageControl packageId */
                    packageId?: (number|null);

                    /** PackageControl scalingMinKhz */
                    scalingMinKhz?: (number|Long|null);

                    /** PackageControl scalingMaxKhz */
                    scalingMaxKhz?: (number|Long|null);

                    /** PackageControl availableGovernors */
                    availableGovernors?: (string[]|null);

                    /** PackageControl currentGovernor */
                    currentGovernor?: (string|null);

                    /** PackageControl scalingDriver */
                    scalingDriver?: (string|null);

                    /** PackageControl uncoreCurrentKhz */
                    uncoreCurrentKhz?: (number|Long|null);

                    /** PackageControl uncoreMinKhz */
                    uncoreMinKhz?: (number|Long|null);

                    /** PackageControl uncoreMaxKhz */
                    uncoreMaxKhz?: (number|Long|null);

                    /** PackageControl powerCapMicroW */
                    powerCapMicroW?: (number|Long|null);

                    /** PackageControl powerCapMinMicroW */
                    powerCapMinMicroW?: (number|Long|null);

                    /** PackageControl powerCapMaxMicroW */
                    powerCapMaxMicroW?: (number|Long|null);

                    /** PackageControl scalingHwMinKhz */
                    scalingHwMinKhz?: (number|Long|null);

                    /** PackageControl scalingHwMaxKhz */
                    scalingHwMaxKhz?: (number|Long|null);
                }

                /** Represents a PackageControl. */
                class PackageControl implements IPackageControl {

                    /**
                     * Constructs a new PackageControl.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: telemetry.module.cpu.v1.IPackageControl);

                    /** PackageControl packageId. */
                    public packageId: number;

                    /** PackageControl scalingMinKhz. */
                    public scalingMinKhz: (number|Long);

                    /** PackageControl scalingMaxKhz. */
                    public scalingMaxKhz: (number|Long);

                    /** PackageControl availableGovernors. */
                    public availableGovernors: string[];

                    /** PackageControl currentGovernor. */
                    public currentGovernor: string;

                    /** PackageControl scalingDriver. */
                    public scalingDriver: string;

                    /** PackageControl uncoreCurrentKhz. */
                    public uncoreCurrentKhz: (number|Long);

                    /** PackageControl uncoreMinKhz. */
                    public uncoreMinKhz: (number|Long);

                    /** PackageControl uncoreMaxKhz. */
                    public uncoreMaxKhz: (number|Long);

                    /** PackageControl powerCapMicroW. */
                    public powerCapMicroW: (number|Long);

                    /** PackageControl powerCapMinMicroW. */
                    public powerCapMinMicroW: (number|Long);

                    /** PackageControl powerCapMaxMicroW. */
                    public powerCapMaxMicroW: (number|Long);

                    /** PackageControl scalingHwMinKhz. */
                    public scalingHwMinKhz: (number|Long);

                    /** PackageControl scalingHwMaxKhz. */
                    public scalingHwMaxKhz: (number|Long);

                    /**
                     * Creates a new PackageControl instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns PackageControl instance
                     */
                    public static create(properties?: telemetry.module.cpu.v1.IPackageControl): telemetry.module.cpu.v1.PackageControl;

                    /**
                     * Encodes the specified PackageControl message. Does not implicitly {@link telemetry.module.cpu.v1.PackageControl.verify|verify} messages.
                     * @param message PackageControl message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: telemetry.module.cpu.v1.IPackageControl, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified PackageControl message, length delimited. Does not implicitly {@link telemetry.module.cpu.v1.PackageControl.verify|verify} messages.
                     * @param message PackageControl message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: telemetry.module.cpu.v1.IPackageControl, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a PackageControl message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns PackageControl
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.module.cpu.v1.PackageControl;

                    /**
                     * Decodes a PackageControl message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns PackageControl
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.module.cpu.v1.PackageControl;

                    /**
                     * Verifies a PackageControl message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a PackageControl message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns PackageControl
                     */
                    public static fromObject(object: { [k: string]: any }): telemetry.module.cpu.v1.PackageControl;

                    /**
                     * Creates a plain object from a PackageControl message. Also converts values to other types if specified.
                     * @param message PackageControl
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: telemetry.module.cpu.v1.PackageControl, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this PackageControl to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };

                    /**
                     * Gets the default type url for PackageControl
                     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns The default type url
                     */
                    public static getTypeUrl(typeUrlPrefix?: string): string;
                }

                /** Properties of a CoreFastMetrics. */
                interface ICoreFastMetrics {

                    /** CoreFastMetrics coreId */
                    coreId?: (number|null);

                    /** CoreFastMetrics utilization */
                    utilization?: (number|null);

                    /** CoreFastMetrics scalingCurKhz */
                    scalingCurKhz?: (number|Long|null);

                    /** CoreFastMetrics packageId */
                    packageId?: (number|null);

                    /** CoreFastMetrics sampledAtUnixNano */
                    sampledAtUnixNano?: (number|Long|null);
                }

                /** Represents a CoreFastMetrics. */
                class CoreFastMetrics implements ICoreFastMetrics {

                    /**
                     * Constructs a new CoreFastMetrics.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: telemetry.module.cpu.v1.ICoreFastMetrics);

                    /** CoreFastMetrics coreId. */
                    public coreId: number;

                    /** CoreFastMetrics utilization. */
                    public utilization: number;

                    /** CoreFastMetrics scalingCurKhz. */
                    public scalingCurKhz: (number|Long);

                    /** CoreFastMetrics packageId. */
                    public packageId: number;

                    /** CoreFastMetrics sampledAtUnixNano. */
                    public sampledAtUnixNano: (number|Long);

                    /**
                     * Creates a new CoreFastMetrics instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns CoreFastMetrics instance
                     */
                    public static create(properties?: telemetry.module.cpu.v1.ICoreFastMetrics): telemetry.module.cpu.v1.CoreFastMetrics;

                    /**
                     * Encodes the specified CoreFastMetrics message. Does not implicitly {@link telemetry.module.cpu.v1.CoreFastMetrics.verify|verify} messages.
                     * @param message CoreFastMetrics message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: telemetry.module.cpu.v1.ICoreFastMetrics, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified CoreFastMetrics message, length delimited. Does not implicitly {@link telemetry.module.cpu.v1.CoreFastMetrics.verify|verify} messages.
                     * @param message CoreFastMetrics message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: telemetry.module.cpu.v1.ICoreFastMetrics, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a CoreFastMetrics message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns CoreFastMetrics
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.module.cpu.v1.CoreFastMetrics;

                    /**
                     * Decodes a CoreFastMetrics message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns CoreFastMetrics
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.module.cpu.v1.CoreFastMetrics;

                    /**
                     * Verifies a CoreFastMetrics message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a CoreFastMetrics message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns CoreFastMetrics
                     */
                    public static fromObject(object: { [k: string]: any }): telemetry.module.cpu.v1.CoreFastMetrics;

                    /**
                     * Creates a plain object from a CoreFastMetrics message. Also converts values to other types if specified.
                     * @param message CoreFastMetrics
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: telemetry.module.cpu.v1.CoreFastMetrics, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this CoreFastMetrics to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };

                    /**
                     * Gets the default type url for CoreFastMetrics
                     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns The default type url
                     */
                    public static getTypeUrl(typeUrlPrefix?: string): string;
                }

                /** Properties of a PackageRAPL. */
                interface IPackageRAPL {

                    /** PackageRAPL packageId */
                    packageId?: (number|null);

                    /** PackageRAPL energyMicroJ */
                    energyMicroJ?: (number|Long|null);

                    /** PackageRAPL powerCapMicroW */
                    powerCapMicroW?: (number|Long|null);

                    /** PackageRAPL sampledAtUnixNano */
                    sampledAtUnixNano?: (number|Long|null);
                }

                /** Represents a PackageRAPL. */
                class PackageRAPL implements IPackageRAPL {

                    /**
                     * Constructs a new PackageRAPL.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: telemetry.module.cpu.v1.IPackageRAPL);

                    /** PackageRAPL packageId. */
                    public packageId: number;

                    /** PackageRAPL energyMicroJ. */
                    public energyMicroJ: (number|Long);

                    /** PackageRAPL powerCapMicroW. */
                    public powerCapMicroW: (number|Long);

                    /** PackageRAPL sampledAtUnixNano. */
                    public sampledAtUnixNano: (number|Long);

                    /**
                     * Creates a new PackageRAPL instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns PackageRAPL instance
                     */
                    public static create(properties?: telemetry.module.cpu.v1.IPackageRAPL): telemetry.module.cpu.v1.PackageRAPL;

                    /**
                     * Encodes the specified PackageRAPL message. Does not implicitly {@link telemetry.module.cpu.v1.PackageRAPL.verify|verify} messages.
                     * @param message PackageRAPL message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: telemetry.module.cpu.v1.IPackageRAPL, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified PackageRAPL message, length delimited. Does not implicitly {@link telemetry.module.cpu.v1.PackageRAPL.verify|verify} messages.
                     * @param message PackageRAPL message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: telemetry.module.cpu.v1.IPackageRAPL, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a PackageRAPL message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns PackageRAPL
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.module.cpu.v1.PackageRAPL;

                    /**
                     * Decodes a PackageRAPL message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns PackageRAPL
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.module.cpu.v1.PackageRAPL;

                    /**
                     * Verifies a PackageRAPL message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a PackageRAPL message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns PackageRAPL
                     */
                    public static fromObject(object: { [k: string]: any }): telemetry.module.cpu.v1.PackageRAPL;

                    /**
                     * Creates a plain object from a PackageRAPL message. Also converts values to other types if specified.
                     * @param message PackageRAPL
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: telemetry.module.cpu.v1.PackageRAPL, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this PackageRAPL to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };

                    /**
                     * Gets the default type url for PackageRAPL
                     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns The default type url
                     */
                    public static getTypeUrl(typeUrlPrefix?: string): string;
                }

                /** Properties of a PackageTemperature. */
                interface IPackageTemperature {

                    /** PackageTemperature packageId */
                    packageId?: (number|null);

                    /** PackageTemperature milliC */
                    milliC?: (number|null);

                    /** PackageTemperature sampledAtUnixNano */
                    sampledAtUnixNano?: (number|Long|null);
                }

                /** Represents a PackageTemperature. */
                class PackageTemperature implements IPackageTemperature {

                    /**
                     * Constructs a new PackageTemperature.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: telemetry.module.cpu.v1.IPackageTemperature);

                    /** PackageTemperature packageId. */
                    public packageId: number;

                    /** PackageTemperature milliC. */
                    public milliC: number;

                    /** PackageTemperature sampledAtUnixNano. */
                    public sampledAtUnixNano: (number|Long);

                    /**
                     * Creates a new PackageTemperature instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns PackageTemperature instance
                     */
                    public static create(properties?: telemetry.module.cpu.v1.IPackageTemperature): telemetry.module.cpu.v1.PackageTemperature;

                    /**
                     * Encodes the specified PackageTemperature message. Does not implicitly {@link telemetry.module.cpu.v1.PackageTemperature.verify|verify} messages.
                     * @param message PackageTemperature message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: telemetry.module.cpu.v1.IPackageTemperature, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified PackageTemperature message, length delimited. Does not implicitly {@link telemetry.module.cpu.v1.PackageTemperature.verify|verify} messages.
                     * @param message PackageTemperature message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: telemetry.module.cpu.v1.IPackageTemperature, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a PackageTemperature message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns PackageTemperature
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.module.cpu.v1.PackageTemperature;

                    /**
                     * Decodes a PackageTemperature message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns PackageTemperature
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.module.cpu.v1.PackageTemperature;

                    /**
                     * Verifies a PackageTemperature message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a PackageTemperature message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns PackageTemperature
                     */
                    public static fromObject(object: { [k: string]: any }): telemetry.module.cpu.v1.PackageTemperature;

                    /**
                     * Creates a plain object from a PackageTemperature message. Also converts values to other types if specified.
                     * @param message PackageTemperature
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: telemetry.module.cpu.v1.PackageTemperature, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this PackageTemperature to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };

                    /**
                     * Gets the default type url for PackageTemperature
                     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns The default type url
                     */
                    public static getTypeUrl(typeUrlPrefix?: string): string;
                }

                /** Properties of a MediumMetrics. */
                interface IMediumMetrics {

                    /** MediumMetrics cores */
                    cores?: (telemetry.module.cpu.v1.ICoreFastMetrics[]|null);

                    /** MediumMetrics temperatures */
                    temperatures?: (telemetry.module.cpu.v1.IPackageTemperature[]|null);
                }

                /** Represents a MediumMetrics. */
                class MediumMetrics implements IMediumMetrics {

                    /**
                     * Constructs a new MediumMetrics.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: telemetry.module.cpu.v1.IMediumMetrics);

                    /** MediumMetrics cores. */
                    public cores: telemetry.module.cpu.v1.ICoreFastMetrics[];

                    /** MediumMetrics temperatures. */
                    public temperatures: telemetry.module.cpu.v1.IPackageTemperature[];

                    /**
                     * Creates a new MediumMetrics instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns MediumMetrics instance
                     */
                    public static create(properties?: telemetry.module.cpu.v1.IMediumMetrics): telemetry.module.cpu.v1.MediumMetrics;

                    /**
                     * Encodes the specified MediumMetrics message. Does not implicitly {@link telemetry.module.cpu.v1.MediumMetrics.verify|verify} messages.
                     * @param message MediumMetrics message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: telemetry.module.cpu.v1.IMediumMetrics, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified MediumMetrics message, length delimited. Does not implicitly {@link telemetry.module.cpu.v1.MediumMetrics.verify|verify} messages.
                     * @param message MediumMetrics message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: telemetry.module.cpu.v1.IMediumMetrics, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a MediumMetrics message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns MediumMetrics
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.module.cpu.v1.MediumMetrics;

                    /**
                     * Decodes a MediumMetrics message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns MediumMetrics
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.module.cpu.v1.MediumMetrics;

                    /**
                     * Verifies a MediumMetrics message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a MediumMetrics message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns MediumMetrics
                     */
                    public static fromObject(object: { [k: string]: any }): telemetry.module.cpu.v1.MediumMetrics;

                    /**
                     * Creates a plain object from a MediumMetrics message. Also converts values to other types if specified.
                     * @param message MediumMetrics
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: telemetry.module.cpu.v1.MediumMetrics, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this MediumMetrics to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };

                    /**
                     * Gets the default type url for MediumMetrics
                     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns The default type url
                     */
                    public static getTypeUrl(typeUrlPrefix?: string): string;
                }

                /** Properties of a PerCoreConfig. */
                interface IPerCoreConfig {

                    /** PerCoreConfig coreId */
                    coreId?: (number|null);

                    /** PerCoreConfig scalingMinKhz */
                    scalingMinKhz?: (number|Long|null);

                    /** PerCoreConfig scalingMaxKhz */
                    scalingMaxKhz?: (number|Long|null);

                    /** PerCoreConfig availableGovernors */
                    availableGovernors?: (string[]|null);

                    /** PerCoreConfig currentGovernor */
                    currentGovernor?: (string|null);

                    /** PerCoreConfig scalingDriver */
                    scalingDriver?: (string|null);

                    /** PerCoreConfig packageId */
                    packageId?: (number|null);

                    /** PerCoreConfig sampledAtUnixNano */
                    sampledAtUnixNano?: (number|Long|null);
                }

                /** Represents a PerCoreConfig. */
                class PerCoreConfig implements IPerCoreConfig {

                    /**
                     * Constructs a new PerCoreConfig.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: telemetry.module.cpu.v1.IPerCoreConfig);

                    /** PerCoreConfig coreId. */
                    public coreId: number;

                    /** PerCoreConfig scalingMinKhz. */
                    public scalingMinKhz: (number|Long);

                    /** PerCoreConfig scalingMaxKhz. */
                    public scalingMaxKhz: (number|Long);

                    /** PerCoreConfig availableGovernors. */
                    public availableGovernors: string[];

                    /** PerCoreConfig currentGovernor. */
                    public currentGovernor: string;

                    /** PerCoreConfig scalingDriver. */
                    public scalingDriver: string;

                    /** PerCoreConfig packageId. */
                    public packageId: number;

                    /** PerCoreConfig sampledAtUnixNano. */
                    public sampledAtUnixNano: (number|Long);

                    /**
                     * Creates a new PerCoreConfig instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns PerCoreConfig instance
                     */
                    public static create(properties?: telemetry.module.cpu.v1.IPerCoreConfig): telemetry.module.cpu.v1.PerCoreConfig;

                    /**
                     * Encodes the specified PerCoreConfig message. Does not implicitly {@link telemetry.module.cpu.v1.PerCoreConfig.verify|verify} messages.
                     * @param message PerCoreConfig message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: telemetry.module.cpu.v1.IPerCoreConfig, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified PerCoreConfig message, length delimited. Does not implicitly {@link telemetry.module.cpu.v1.PerCoreConfig.verify|verify} messages.
                     * @param message PerCoreConfig message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: telemetry.module.cpu.v1.IPerCoreConfig, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a PerCoreConfig message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns PerCoreConfig
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.module.cpu.v1.PerCoreConfig;

                    /**
                     * Decodes a PerCoreConfig message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns PerCoreConfig
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.module.cpu.v1.PerCoreConfig;

                    /**
                     * Verifies a PerCoreConfig message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a PerCoreConfig message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns PerCoreConfig
                     */
                    public static fromObject(object: { [k: string]: any }): telemetry.module.cpu.v1.PerCoreConfig;

                    /**
                     * Creates a plain object from a PerCoreConfig message. Also converts values to other types if specified.
                     * @param message PerCoreConfig
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: telemetry.module.cpu.v1.PerCoreConfig, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this PerCoreConfig to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };

                    /**
                     * Gets the default type url for PerCoreConfig
                     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns The default type url
                     */
                    public static getTypeUrl(typeUrlPrefix?: string): string;
                }

                /** Properties of an UncoreMetrics. */
                interface IUncoreMetrics {

                    /** UncoreMetrics packageId */
                    packageId?: (number|null);

                    /** UncoreMetrics currentKhz */
                    currentKhz?: (number|Long|null);

                    /** UncoreMetrics minKhz */
                    minKhz?: (number|Long|null);

                    /** UncoreMetrics maxKhz */
                    maxKhz?: (number|Long|null);

                    /** UncoreMetrics initialMinKhz */
                    initialMinKhz?: (number|Long|null);

                    /** UncoreMetrics initialMaxKhz */
                    initialMaxKhz?: (number|Long|null);

                    /** UncoreMetrics sampledAtUnixNano */
                    sampledAtUnixNano?: (number|Long|null);
                }

                /** Represents an UncoreMetrics. */
                class UncoreMetrics implements IUncoreMetrics {

                    /**
                     * Constructs a new UncoreMetrics.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: telemetry.module.cpu.v1.IUncoreMetrics);

                    /** UncoreMetrics packageId. */
                    public packageId: number;

                    /** UncoreMetrics currentKhz. */
                    public currentKhz: (number|Long);

                    /** UncoreMetrics minKhz. */
                    public minKhz: (number|Long);

                    /** UncoreMetrics maxKhz. */
                    public maxKhz: (number|Long);

                    /** UncoreMetrics initialMinKhz. */
                    public initialMinKhz: (number|Long);

                    /** UncoreMetrics initialMaxKhz. */
                    public initialMaxKhz: (number|Long);

                    /** UncoreMetrics sampledAtUnixNano. */
                    public sampledAtUnixNano: (number|Long);

                    /**
                     * Creates a new UncoreMetrics instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns UncoreMetrics instance
                     */
                    public static create(properties?: telemetry.module.cpu.v1.IUncoreMetrics): telemetry.module.cpu.v1.UncoreMetrics;

                    /**
                     * Encodes the specified UncoreMetrics message. Does not implicitly {@link telemetry.module.cpu.v1.UncoreMetrics.verify|verify} messages.
                     * @param message UncoreMetrics message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: telemetry.module.cpu.v1.IUncoreMetrics, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified UncoreMetrics message, length delimited. Does not implicitly {@link telemetry.module.cpu.v1.UncoreMetrics.verify|verify} messages.
                     * @param message UncoreMetrics message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: telemetry.module.cpu.v1.IUncoreMetrics, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes an UncoreMetrics message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns UncoreMetrics
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.module.cpu.v1.UncoreMetrics;

                    /**
                     * Decodes an UncoreMetrics message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns UncoreMetrics
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.module.cpu.v1.UncoreMetrics;

                    /**
                     * Verifies an UncoreMetrics message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates an UncoreMetrics message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns UncoreMetrics
                     */
                    public static fromObject(object: { [k: string]: any }): telemetry.module.cpu.v1.UncoreMetrics;

                    /**
                     * Creates a plain object from an UncoreMetrics message. Also converts values to other types if specified.
                     * @param message UncoreMetrics
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: telemetry.module.cpu.v1.UncoreMetrics, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this UncoreMetrics to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };

                    /**
                     * Gets the default type url for UncoreMetrics
                     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns The default type url
                     */
                    public static getTypeUrl(typeUrlPrefix?: string): string;
                }

                /** Properties of an UltraMetrics. */
                interface IUltraMetrics {

                    /** UltraMetrics perCore */
                    perCore?: (telemetry.module.cpu.v1.IPerCoreConfig[]|null);

                    /** UltraMetrics rapl */
                    rapl?: (telemetry.module.cpu.v1.IPackageRAPL[]|null);

                    /** UltraMetrics uncore */
                    uncore?: (telemetry.module.cpu.v1.IUncoreMetrics[]|null);
                }

                /** Represents an UltraMetrics. */
                class UltraMetrics implements IUltraMetrics {

                    /**
                     * Constructs a new UltraMetrics.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: telemetry.module.cpu.v1.IUltraMetrics);

                    /** UltraMetrics perCore. */
                    public perCore: telemetry.module.cpu.v1.IPerCoreConfig[];

                    /** UltraMetrics rapl. */
                    public rapl: telemetry.module.cpu.v1.IPackageRAPL[];

                    /** UltraMetrics uncore. */
                    public uncore: telemetry.module.cpu.v1.IUncoreMetrics[];

                    /**
                     * Creates a new UltraMetrics instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns UltraMetrics instance
                     */
                    public static create(properties?: telemetry.module.cpu.v1.IUltraMetrics): telemetry.module.cpu.v1.UltraMetrics;

                    /**
                     * Encodes the specified UltraMetrics message. Does not implicitly {@link telemetry.module.cpu.v1.UltraMetrics.verify|verify} messages.
                     * @param message UltraMetrics message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: telemetry.module.cpu.v1.IUltraMetrics, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified UltraMetrics message, length delimited. Does not implicitly {@link telemetry.module.cpu.v1.UltraMetrics.verify|verify} messages.
                     * @param message UltraMetrics message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: telemetry.module.cpu.v1.IUltraMetrics, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes an UltraMetrics message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns UltraMetrics
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.module.cpu.v1.UltraMetrics;

                    /**
                     * Decodes an UltraMetrics message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns UltraMetrics
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.module.cpu.v1.UltraMetrics;

                    /**
                     * Verifies an UltraMetrics message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates an UltraMetrics message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns UltraMetrics
                     */
                    public static fromObject(object: { [k: string]: any }): telemetry.module.cpu.v1.UltraMetrics;

                    /**
                     * Creates a plain object from an UltraMetrics message. Also converts values to other types if specified.
                     * @param message UltraMetrics
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: telemetry.module.cpu.v1.UltraMetrics, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this UltraMetrics to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };

                    /**
                     * Gets the default type url for UltraMetrics
                     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns The default type url
                     */
                    public static getTypeUrl(typeUrlPrefix?: string): string;
                }

                /** Properties of a ScalingRangeCommand. */
                interface IScalingRangeCommand {

                    /** ScalingRangeCommand minKhz */
                    minKhz?: (number|Long|null);

                    /** ScalingRangeCommand maxKhz */
                    maxKhz?: (number|Long|null);

                    /** ScalingRangeCommand packageId */
                    packageId?: (number|null);
                }

                /** Represents a ScalingRangeCommand. */
                class ScalingRangeCommand implements IScalingRangeCommand {

                    /**
                     * Constructs a new ScalingRangeCommand.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: telemetry.module.cpu.v1.IScalingRangeCommand);

                    /** ScalingRangeCommand minKhz. */
                    public minKhz: (number|Long);

                    /** ScalingRangeCommand maxKhz. */
                    public maxKhz: (number|Long);

                    /** ScalingRangeCommand packageId. */
                    public packageId?: (number|null);

                    /**
                     * Creates a new ScalingRangeCommand instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns ScalingRangeCommand instance
                     */
                    public static create(properties?: telemetry.module.cpu.v1.IScalingRangeCommand): telemetry.module.cpu.v1.ScalingRangeCommand;

                    /**
                     * Encodes the specified ScalingRangeCommand message. Does not implicitly {@link telemetry.module.cpu.v1.ScalingRangeCommand.verify|verify} messages.
                     * @param message ScalingRangeCommand message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: telemetry.module.cpu.v1.IScalingRangeCommand, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified ScalingRangeCommand message, length delimited. Does not implicitly {@link telemetry.module.cpu.v1.ScalingRangeCommand.verify|verify} messages.
                     * @param message ScalingRangeCommand message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: telemetry.module.cpu.v1.IScalingRangeCommand, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a ScalingRangeCommand message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns ScalingRangeCommand
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.module.cpu.v1.ScalingRangeCommand;

                    /**
                     * Decodes a ScalingRangeCommand message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns ScalingRangeCommand
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.module.cpu.v1.ScalingRangeCommand;

                    /**
                     * Verifies a ScalingRangeCommand message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a ScalingRangeCommand message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns ScalingRangeCommand
                     */
                    public static fromObject(object: { [k: string]: any }): telemetry.module.cpu.v1.ScalingRangeCommand;

                    /**
                     * Creates a plain object from a ScalingRangeCommand message. Also converts values to other types if specified.
                     * @param message ScalingRangeCommand
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: telemetry.module.cpu.v1.ScalingRangeCommand, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this ScalingRangeCommand to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };

                    /**
                     * Gets the default type url for ScalingRangeCommand
                     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns The default type url
                     */
                    public static getTypeUrl(typeUrlPrefix?: string): string;
                }

                /** Properties of a GovernorCommand. */
                interface IGovernorCommand {

                    /** GovernorCommand governor */
                    governor?: (string|null);

                    /** GovernorCommand packageId */
                    packageId?: (number|null);
                }

                /** Represents a GovernorCommand. */
                class GovernorCommand implements IGovernorCommand {

                    /**
                     * Constructs a new GovernorCommand.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: telemetry.module.cpu.v1.IGovernorCommand);

                    /** GovernorCommand governor. */
                    public governor: string;

                    /** GovernorCommand packageId. */
                    public packageId?: (number|null);

                    /**
                     * Creates a new GovernorCommand instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns GovernorCommand instance
                     */
                    public static create(properties?: telemetry.module.cpu.v1.IGovernorCommand): telemetry.module.cpu.v1.GovernorCommand;

                    /**
                     * Encodes the specified GovernorCommand message. Does not implicitly {@link telemetry.module.cpu.v1.GovernorCommand.verify|verify} messages.
                     * @param message GovernorCommand message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: telemetry.module.cpu.v1.IGovernorCommand, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified GovernorCommand message, length delimited. Does not implicitly {@link telemetry.module.cpu.v1.GovernorCommand.verify|verify} messages.
                     * @param message GovernorCommand message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: telemetry.module.cpu.v1.IGovernorCommand, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a GovernorCommand message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns GovernorCommand
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.module.cpu.v1.GovernorCommand;

                    /**
                     * Decodes a GovernorCommand message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns GovernorCommand
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.module.cpu.v1.GovernorCommand;

                    /**
                     * Verifies a GovernorCommand message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a GovernorCommand message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns GovernorCommand
                     */
                    public static fromObject(object: { [k: string]: any }): telemetry.module.cpu.v1.GovernorCommand;

                    /**
                     * Creates a plain object from a GovernorCommand message. Also converts values to other types if specified.
                     * @param message GovernorCommand
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: telemetry.module.cpu.v1.GovernorCommand, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this GovernorCommand to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };

                    /**
                     * Gets the default type url for GovernorCommand
                     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns The default type url
                     */
                    public static getTypeUrl(typeUrlPrefix?: string): string;
                }

                /** Properties of an UncoreRangeCommand. */
                interface IUncoreRangeCommand {

                    /** UncoreRangeCommand packageId */
                    packageId?: (number|null);

                    /** UncoreRangeCommand minKhz */
                    minKhz?: (number|Long|null);

                    /** UncoreRangeCommand maxKhz */
                    maxKhz?: (number|Long|null);
                }

                /** Represents an UncoreRangeCommand. */
                class UncoreRangeCommand implements IUncoreRangeCommand {

                    /**
                     * Constructs a new UncoreRangeCommand.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: telemetry.module.cpu.v1.IUncoreRangeCommand);

                    /** UncoreRangeCommand packageId. */
                    public packageId: number;

                    /** UncoreRangeCommand minKhz. */
                    public minKhz: (number|Long);

                    /** UncoreRangeCommand maxKhz. */
                    public maxKhz: (number|Long);

                    /**
                     * Creates a new UncoreRangeCommand instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns UncoreRangeCommand instance
                     */
                    public static create(properties?: telemetry.module.cpu.v1.IUncoreRangeCommand): telemetry.module.cpu.v1.UncoreRangeCommand;

                    /**
                     * Encodes the specified UncoreRangeCommand message. Does not implicitly {@link telemetry.module.cpu.v1.UncoreRangeCommand.verify|verify} messages.
                     * @param message UncoreRangeCommand message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: telemetry.module.cpu.v1.IUncoreRangeCommand, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified UncoreRangeCommand message, length delimited. Does not implicitly {@link telemetry.module.cpu.v1.UncoreRangeCommand.verify|verify} messages.
                     * @param message UncoreRangeCommand message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: telemetry.module.cpu.v1.IUncoreRangeCommand, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes an UncoreRangeCommand message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns UncoreRangeCommand
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.module.cpu.v1.UncoreRangeCommand;

                    /**
                     * Decodes an UncoreRangeCommand message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns UncoreRangeCommand
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.module.cpu.v1.UncoreRangeCommand;

                    /**
                     * Verifies an UncoreRangeCommand message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates an UncoreRangeCommand message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns UncoreRangeCommand
                     */
                    public static fromObject(object: { [k: string]: any }): telemetry.module.cpu.v1.UncoreRangeCommand;

                    /**
                     * Creates a plain object from an UncoreRangeCommand message. Also converts values to other types if specified.
                     * @param message UncoreRangeCommand
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: telemetry.module.cpu.v1.UncoreRangeCommand, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this UncoreRangeCommand to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };

                    /**
                     * Gets the default type url for UncoreRangeCommand
                     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns The default type url
                     */
                    public static getTypeUrl(typeUrlPrefix?: string): string;
                }

                /** Properties of a PowerCapCommand. */
                interface IPowerCapCommand {

                    /** PowerCapCommand packageId */
                    packageId?: (number|null);

                    /** PowerCapCommand microwatt */
                    microwatt?: (number|Long|null);
                }

                /** Represents a PowerCapCommand. */
                class PowerCapCommand implements IPowerCapCommand {

                    /**
                     * Constructs a new PowerCapCommand.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: telemetry.module.cpu.v1.IPowerCapCommand);

                    /** PowerCapCommand packageId. */
                    public packageId: number;

                    /** PowerCapCommand microwatt. */
                    public microwatt: (number|Long);

                    /**
                     * Creates a new PowerCapCommand instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns PowerCapCommand instance
                     */
                    public static create(properties?: telemetry.module.cpu.v1.IPowerCapCommand): telemetry.module.cpu.v1.PowerCapCommand;

                    /**
                     * Encodes the specified PowerCapCommand message. Does not implicitly {@link telemetry.module.cpu.v1.PowerCapCommand.verify|verify} messages.
                     * @param message PowerCapCommand message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: telemetry.module.cpu.v1.IPowerCapCommand, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified PowerCapCommand message, length delimited. Does not implicitly {@link telemetry.module.cpu.v1.PowerCapCommand.verify|verify} messages.
                     * @param message PowerCapCommand message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: telemetry.module.cpu.v1.IPowerCapCommand, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a PowerCapCommand message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns PowerCapCommand
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.module.cpu.v1.PowerCapCommand;

                    /**
                     * Decodes a PowerCapCommand message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns PowerCapCommand
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.module.cpu.v1.PowerCapCommand;

                    /**
                     * Verifies a PowerCapCommand message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a PowerCapCommand message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns PowerCapCommand
                     */
                    public static fromObject(object: { [k: string]: any }): telemetry.module.cpu.v1.PowerCapCommand;

                    /**
                     * Creates a plain object from a PowerCapCommand message. Also converts values to other types if specified.
                     * @param message PowerCapCommand
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: telemetry.module.cpu.v1.PowerCapCommand, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this PowerCapCommand to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };

                    /**
                     * Gets the default type url for PowerCapCommand
                     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns The default type url
                     */
                    public static getTypeUrl(typeUrlPrefix?: string): string;
                }
            }
        }

        /** Namespace gpu. */
        namespace gpu {

            /** Namespace v1. */
            namespace v1 {

                /** Properties of a CollectorSpec. */
                interface ICollectorSpec {

                    /** CollectorSpec category */
                    category?: (string|null);

                    /** CollectorSpec interval */
                    interval?: (string|null);
                }

                /** Represents a CollectorSpec. */
                class CollectorSpec implements ICollectorSpec {

                    /**
                     * Constructs a new CollectorSpec.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: telemetry.module.gpu.v1.ICollectorSpec);

                    /** CollectorSpec category. */
                    public category: string;

                    /** CollectorSpec interval. */
                    public interval: string;

                    /**
                     * Creates a new CollectorSpec instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns CollectorSpec instance
                     */
                    public static create(properties?: telemetry.module.gpu.v1.ICollectorSpec): telemetry.module.gpu.v1.CollectorSpec;

                    /**
                     * Encodes the specified CollectorSpec message. Does not implicitly {@link telemetry.module.gpu.v1.CollectorSpec.verify|verify} messages.
                     * @param message CollectorSpec message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: telemetry.module.gpu.v1.ICollectorSpec, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified CollectorSpec message, length delimited. Does not implicitly {@link telemetry.module.gpu.v1.CollectorSpec.verify|verify} messages.
                     * @param message CollectorSpec message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: telemetry.module.gpu.v1.ICollectorSpec, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a CollectorSpec message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns CollectorSpec
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.module.gpu.v1.CollectorSpec;

                    /**
                     * Decodes a CollectorSpec message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns CollectorSpec
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.module.gpu.v1.CollectorSpec;

                    /**
                     * Verifies a CollectorSpec message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a CollectorSpec message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns CollectorSpec
                     */
                    public static fromObject(object: { [k: string]: any }): telemetry.module.gpu.v1.CollectorSpec;

                    /**
                     * Creates a plain object from a CollectorSpec message. Also converts values to other types if specified.
                     * @param message CollectorSpec
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: telemetry.module.gpu.v1.CollectorSpec, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this CollectorSpec to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };

                    /**
                     * Gets the default type url for CollectorSpec
                     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns The default type url
                     */
                    public static getTypeUrl(typeUrlPrefix?: string): string;
                }

                /** Properties of a ControllerSpec. */
                interface IControllerSpec {

                    /** ControllerSpec type */
                    type?: (string|null);
                }

                /** Represents a ControllerSpec. */
                class ControllerSpec implements IControllerSpec {

                    /**
                     * Constructs a new ControllerSpec.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: telemetry.module.gpu.v1.IControllerSpec);

                    /** ControllerSpec type. */
                    public type: string;

                    /**
                     * Creates a new ControllerSpec instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns ControllerSpec instance
                     */
                    public static create(properties?: telemetry.module.gpu.v1.IControllerSpec): telemetry.module.gpu.v1.ControllerSpec;

                    /**
                     * Encodes the specified ControllerSpec message. Does not implicitly {@link telemetry.module.gpu.v1.ControllerSpec.verify|verify} messages.
                     * @param message ControllerSpec message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: telemetry.module.gpu.v1.IControllerSpec, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified ControllerSpec message, length delimited. Does not implicitly {@link telemetry.module.gpu.v1.ControllerSpec.verify|verify} messages.
                     * @param message ControllerSpec message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: telemetry.module.gpu.v1.IControllerSpec, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a ControllerSpec message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns ControllerSpec
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.module.gpu.v1.ControllerSpec;

                    /**
                     * Decodes a ControllerSpec message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns ControllerSpec
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.module.gpu.v1.ControllerSpec;

                    /**
                     * Verifies a ControllerSpec message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a ControllerSpec message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns ControllerSpec
                     */
                    public static fromObject(object: { [k: string]: any }): telemetry.module.gpu.v1.ControllerSpec;

                    /**
                     * Creates a plain object from a ControllerSpec message. Also converts values to other types if specified.
                     * @param message ControllerSpec
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: telemetry.module.gpu.v1.ControllerSpec, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this ControllerSpec to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };

                    /**
                     * Gets the default type url for ControllerSpec
                     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns The default type url
                     */
                    public static getTypeUrl(typeUrlPrefix?: string): string;
                }

                /** Properties of a StaticInfo. */
                interface IStaticInfo {

                    /** StaticInfo index */
                    index?: (number|null);

                    /** StaticInfo name */
                    name?: (string|null);

                    /** StaticInfo uuid */
                    uuid?: (string|null);

                    /** StaticInfo memoryTotalBytes */
                    memoryTotalBytes?: (number|Long|null);

                    /** StaticInfo powerMinMilliwatt */
                    powerMinMilliwatt?: (number|null);

                    /** StaticInfo powerMaxMilliwatt */
                    powerMaxMilliwatt?: (number|null);

                    /** StaticInfo smClockMinMhz */
                    smClockMinMhz?: (number|null);

                    /** StaticInfo smClockMaxMhz */
                    smClockMaxMhz?: (number|null);

                    /** StaticInfo memClockMinMhz */
                    memClockMinMhz?: (number|null);

                    /** StaticInfo memClockMaxMhz */
                    memClockMaxMhz?: (number|null);
                }

                /** Represents a StaticInfo. */
                class StaticInfo implements IStaticInfo {

                    /**
                     * Constructs a new StaticInfo.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: telemetry.module.gpu.v1.IStaticInfo);

                    /** StaticInfo index. */
                    public index: number;

                    /** StaticInfo name. */
                    public name: string;

                    /** StaticInfo uuid. */
                    public uuid: string;

                    /** StaticInfo memoryTotalBytes. */
                    public memoryTotalBytes: (number|Long);

                    /** StaticInfo powerMinMilliwatt. */
                    public powerMinMilliwatt: number;

                    /** StaticInfo powerMaxMilliwatt. */
                    public powerMaxMilliwatt: number;

                    /** StaticInfo smClockMinMhz. */
                    public smClockMinMhz: number;

                    /** StaticInfo smClockMaxMhz. */
                    public smClockMaxMhz: number;

                    /** StaticInfo memClockMinMhz. */
                    public memClockMinMhz: number;

                    /** StaticInfo memClockMaxMhz. */
                    public memClockMaxMhz: number;

                    /**
                     * Creates a new StaticInfo instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns StaticInfo instance
                     */
                    public static create(properties?: telemetry.module.gpu.v1.IStaticInfo): telemetry.module.gpu.v1.StaticInfo;

                    /**
                     * Encodes the specified StaticInfo message. Does not implicitly {@link telemetry.module.gpu.v1.StaticInfo.verify|verify} messages.
                     * @param message StaticInfo message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: telemetry.module.gpu.v1.IStaticInfo, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified StaticInfo message, length delimited. Does not implicitly {@link telemetry.module.gpu.v1.StaticInfo.verify|verify} messages.
                     * @param message StaticInfo message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: telemetry.module.gpu.v1.IStaticInfo, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a StaticInfo message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns StaticInfo
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.module.gpu.v1.StaticInfo;

                    /**
                     * Decodes a StaticInfo message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns StaticInfo
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.module.gpu.v1.StaticInfo;

                    /**
                     * Verifies a StaticInfo message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a StaticInfo message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns StaticInfo
                     */
                    public static fromObject(object: { [k: string]: any }): telemetry.module.gpu.v1.StaticInfo;

                    /**
                     * Creates a plain object from a StaticInfo message. Also converts values to other types if specified.
                     * @param message StaticInfo
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: telemetry.module.gpu.v1.StaticInfo, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this StaticInfo to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };

                    /**
                     * Gets the default type url for StaticInfo
                     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns The default type url
                     */
                    public static getTypeUrl(typeUrlPrefix?: string): string;
                }

                /** Properties of a ModuleRegistration. */
                interface IModuleRegistration {

                    /** ModuleRegistration static */
                    "static"?: (telemetry.module.gpu.v1.IStaticInfo[]|null);

                    /** ModuleRegistration collectors */
                    collectors?: (telemetry.module.gpu.v1.ICollectorSpec[]|null);

                    /** ModuleRegistration controllers */
                    controllers?: (telemetry.module.gpu.v1.IControllerSpec[]|null);
                }

                /** Represents a ModuleRegistration. */
                class ModuleRegistration implements IModuleRegistration {

                    /**
                     * Constructs a new ModuleRegistration.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: telemetry.module.gpu.v1.IModuleRegistration);

                    /** ModuleRegistration static. */
                    public static: telemetry.module.gpu.v1.IStaticInfo[];

                    /** ModuleRegistration collectors. */
                    public collectors: telemetry.module.gpu.v1.ICollectorSpec[];

                    /** ModuleRegistration controllers. */
                    public controllers: telemetry.module.gpu.v1.IControllerSpec[];

                    /**
                     * Creates a new ModuleRegistration instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns ModuleRegistration instance
                     */
                    public static create(properties?: telemetry.module.gpu.v1.IModuleRegistration): telemetry.module.gpu.v1.ModuleRegistration;

                    /**
                     * Encodes the specified ModuleRegistration message. Does not implicitly {@link telemetry.module.gpu.v1.ModuleRegistration.verify|verify} messages.
                     * @param message ModuleRegistration message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: telemetry.module.gpu.v1.IModuleRegistration, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified ModuleRegistration message, length delimited. Does not implicitly {@link telemetry.module.gpu.v1.ModuleRegistration.verify|verify} messages.
                     * @param message ModuleRegistration message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: telemetry.module.gpu.v1.IModuleRegistration, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a ModuleRegistration message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns ModuleRegistration
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.module.gpu.v1.ModuleRegistration;

                    /**
                     * Decodes a ModuleRegistration message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns ModuleRegistration
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.module.gpu.v1.ModuleRegistration;

                    /**
                     * Verifies a ModuleRegistration message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a ModuleRegistration message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns ModuleRegistration
                     */
                    public static fromObject(object: { [k: string]: any }): telemetry.module.gpu.v1.ModuleRegistration;

                    /**
                     * Creates a plain object from a ModuleRegistration message. Also converts values to other types if specified.
                     * @param message ModuleRegistration
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: telemetry.module.gpu.v1.ModuleRegistration, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this ModuleRegistration to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };

                    /**
                     * Gets the default type url for ModuleRegistration
                     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns The default type url
                     */
                    public static getTypeUrl(typeUrlPrefix?: string): string;
                }

                /** Properties of a DeviceFastMetrics. */
                interface IDeviceFastMetrics {

                    /** DeviceFastMetrics index */
                    index?: (number|null);

                    /** DeviceFastMetrics utilizationGpu */
                    utilizationGpu?: (number|null);

                    /** DeviceFastMetrics utilizationMem */
                    utilizationMem?: (number|null);

                    /** DeviceFastMetrics memoryUsedBytes */
                    memoryUsedBytes?: (number|Long|null);

                    /** DeviceFastMetrics temperatureC */
                    temperatureC?: (number|null);

                    /** DeviceFastMetrics powerUsageMilliwatt */
                    powerUsageMilliwatt?: (number|null);

                    /** DeviceFastMetrics graphicsClockMhz */
                    graphicsClockMhz?: (number|null);

                    /** DeviceFastMetrics memoryClockMhz */
                    memoryClockMhz?: (number|null);

                    /** DeviceFastMetrics smClockMinMhz */
                    smClockMinMhz?: (number|null);

                    /** DeviceFastMetrics smClockMaxMhz */
                    smClockMaxMhz?: (number|null);

                    /** DeviceFastMetrics memClockMinMhz */
                    memClockMinMhz?: (number|null);

                    /** DeviceFastMetrics memClockMaxMhz */
                    memClockMaxMhz?: (number|null);

                    /** DeviceFastMetrics powerLimitMilliwatt */
                    powerLimitMilliwatt?: (number|null);

                    /** DeviceFastMetrics sampledAtUnixNano */
                    sampledAtUnixNano?: (number|Long|null);
                }

                /** Represents a DeviceFastMetrics. */
                class DeviceFastMetrics implements IDeviceFastMetrics {

                    /**
                     * Constructs a new DeviceFastMetrics.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: telemetry.module.gpu.v1.IDeviceFastMetrics);

                    /** DeviceFastMetrics index. */
                    public index: number;

                    /** DeviceFastMetrics utilizationGpu. */
                    public utilizationGpu: number;

                    /** DeviceFastMetrics utilizationMem. */
                    public utilizationMem: number;

                    /** DeviceFastMetrics memoryUsedBytes. */
                    public memoryUsedBytes: (number|Long);

                    /** DeviceFastMetrics temperatureC. */
                    public temperatureC: number;

                    /** DeviceFastMetrics powerUsageMilliwatt. */
                    public powerUsageMilliwatt: number;

                    /** DeviceFastMetrics graphicsClockMhz. */
                    public graphicsClockMhz: number;

                    /** DeviceFastMetrics memoryClockMhz. */
                    public memoryClockMhz: number;

                    /** DeviceFastMetrics smClockMinMhz. */
                    public smClockMinMhz: number;

                    /** DeviceFastMetrics smClockMaxMhz. */
                    public smClockMaxMhz: number;

                    /** DeviceFastMetrics memClockMinMhz. */
                    public memClockMinMhz: number;

                    /** DeviceFastMetrics memClockMaxMhz. */
                    public memClockMaxMhz: number;

                    /** DeviceFastMetrics powerLimitMilliwatt. */
                    public powerLimitMilliwatt: number;

                    /** DeviceFastMetrics sampledAtUnixNano. */
                    public sampledAtUnixNano: (number|Long);

                    /**
                     * Creates a new DeviceFastMetrics instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns DeviceFastMetrics instance
                     */
                    public static create(properties?: telemetry.module.gpu.v1.IDeviceFastMetrics): telemetry.module.gpu.v1.DeviceFastMetrics;

                    /**
                     * Encodes the specified DeviceFastMetrics message. Does not implicitly {@link telemetry.module.gpu.v1.DeviceFastMetrics.verify|verify} messages.
                     * @param message DeviceFastMetrics message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: telemetry.module.gpu.v1.IDeviceFastMetrics, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified DeviceFastMetrics message, length delimited. Does not implicitly {@link telemetry.module.gpu.v1.DeviceFastMetrics.verify|verify} messages.
                     * @param message DeviceFastMetrics message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: telemetry.module.gpu.v1.IDeviceFastMetrics, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a DeviceFastMetrics message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns DeviceFastMetrics
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.module.gpu.v1.DeviceFastMetrics;

                    /**
                     * Decodes a DeviceFastMetrics message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns DeviceFastMetrics
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.module.gpu.v1.DeviceFastMetrics;

                    /**
                     * Verifies a DeviceFastMetrics message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a DeviceFastMetrics message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns DeviceFastMetrics
                     */
                    public static fromObject(object: { [k: string]: any }): telemetry.module.gpu.v1.DeviceFastMetrics;

                    /**
                     * Creates a plain object from a DeviceFastMetrics message. Also converts values to other types if specified.
                     * @param message DeviceFastMetrics
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: telemetry.module.gpu.v1.DeviceFastMetrics, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this DeviceFastMetrics to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };

                    /**
                     * Gets the default type url for DeviceFastMetrics
                     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns The default type url
                     */
                    public static getTypeUrl(typeUrlPrefix?: string): string;
                }

                /** Properties of a FastMetrics. */
                interface IFastMetrics {

                    /** FastMetrics devices */
                    devices?: (telemetry.module.gpu.v1.IDeviceFastMetrics[]|null);
                }

                /** Represents a FastMetrics. */
                class FastMetrics implements IFastMetrics {

                    /**
                     * Constructs a new FastMetrics.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: telemetry.module.gpu.v1.IFastMetrics);

                    /** FastMetrics devices. */
                    public devices: telemetry.module.gpu.v1.IDeviceFastMetrics[];

                    /**
                     * Creates a new FastMetrics instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns FastMetrics instance
                     */
                    public static create(properties?: telemetry.module.gpu.v1.IFastMetrics): telemetry.module.gpu.v1.FastMetrics;

                    /**
                     * Encodes the specified FastMetrics message. Does not implicitly {@link telemetry.module.gpu.v1.FastMetrics.verify|verify} messages.
                     * @param message FastMetrics message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: telemetry.module.gpu.v1.IFastMetrics, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified FastMetrics message, length delimited. Does not implicitly {@link telemetry.module.gpu.v1.FastMetrics.verify|verify} messages.
                     * @param message FastMetrics message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: telemetry.module.gpu.v1.IFastMetrics, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a FastMetrics message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns FastMetrics
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.module.gpu.v1.FastMetrics;

                    /**
                     * Decodes a FastMetrics message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns FastMetrics
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.module.gpu.v1.FastMetrics;

                    /**
                     * Verifies a FastMetrics message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a FastMetrics message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns FastMetrics
                     */
                    public static fromObject(object: { [k: string]: any }): telemetry.module.gpu.v1.FastMetrics;

                    /**
                     * Creates a plain object from a FastMetrics message. Also converts values to other types if specified.
                     * @param message FastMetrics
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: telemetry.module.gpu.v1.FastMetrics, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this FastMetrics to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };

                    /**
                     * Gets the default type url for FastMetrics
                     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns The default type url
                     */
                    public static getTypeUrl(typeUrlPrefix?: string): string;
                }

                /** Properties of a ClockRangeCommand. */
                interface IClockRangeCommand {

                    /** ClockRangeCommand gpuIndex */
                    gpuIndex?: (number|null);

                    /** ClockRangeCommand smMinMhz */
                    smMinMhz?: (number|null);

                    /** ClockRangeCommand smMaxMhz */
                    smMaxMhz?: (number|null);

                    /** ClockRangeCommand memMinMhz */
                    memMinMhz?: (number|null);

                    /** ClockRangeCommand memMaxMhz */
                    memMaxMhz?: (number|null);
                }

                /** Represents a ClockRangeCommand. */
                class ClockRangeCommand implements IClockRangeCommand {

                    /**
                     * Constructs a new ClockRangeCommand.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: telemetry.module.gpu.v1.IClockRangeCommand);

                    /** ClockRangeCommand gpuIndex. */
                    public gpuIndex: number;

                    /** ClockRangeCommand smMinMhz. */
                    public smMinMhz: number;

                    /** ClockRangeCommand smMaxMhz. */
                    public smMaxMhz: number;

                    /** ClockRangeCommand memMinMhz. */
                    public memMinMhz: number;

                    /** ClockRangeCommand memMaxMhz. */
                    public memMaxMhz: number;

                    /**
                     * Creates a new ClockRangeCommand instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns ClockRangeCommand instance
                     */
                    public static create(properties?: telemetry.module.gpu.v1.IClockRangeCommand): telemetry.module.gpu.v1.ClockRangeCommand;

                    /**
                     * Encodes the specified ClockRangeCommand message. Does not implicitly {@link telemetry.module.gpu.v1.ClockRangeCommand.verify|verify} messages.
                     * @param message ClockRangeCommand message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: telemetry.module.gpu.v1.IClockRangeCommand, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified ClockRangeCommand message, length delimited. Does not implicitly {@link telemetry.module.gpu.v1.ClockRangeCommand.verify|verify} messages.
                     * @param message ClockRangeCommand message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: telemetry.module.gpu.v1.IClockRangeCommand, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a ClockRangeCommand message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns ClockRangeCommand
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.module.gpu.v1.ClockRangeCommand;

                    /**
                     * Decodes a ClockRangeCommand message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns ClockRangeCommand
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.module.gpu.v1.ClockRangeCommand;

                    /**
                     * Verifies a ClockRangeCommand message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a ClockRangeCommand message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns ClockRangeCommand
                     */
                    public static fromObject(object: { [k: string]: any }): telemetry.module.gpu.v1.ClockRangeCommand;

                    /**
                     * Creates a plain object from a ClockRangeCommand message. Also converts values to other types if specified.
                     * @param message ClockRangeCommand
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: telemetry.module.gpu.v1.ClockRangeCommand, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this ClockRangeCommand to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };

                    /**
                     * Gets the default type url for ClockRangeCommand
                     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns The default type url
                     */
                    public static getTypeUrl(typeUrlPrefix?: string): string;
                }

                /** Properties of a PowerCapCommand. */
                interface IPowerCapCommand {

                    /** PowerCapCommand gpuIndex */
                    gpuIndex?: (number|null);

                    /** PowerCapCommand milliwatt */
                    milliwatt?: (number|null);
                }

                /** Represents a PowerCapCommand. */
                class PowerCapCommand implements IPowerCapCommand {

                    /**
                     * Constructs a new PowerCapCommand.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: telemetry.module.gpu.v1.IPowerCapCommand);

                    /** PowerCapCommand gpuIndex. */
                    public gpuIndex: number;

                    /** PowerCapCommand milliwatt. */
                    public milliwatt: number;

                    /**
                     * Creates a new PowerCapCommand instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns PowerCapCommand instance
                     */
                    public static create(properties?: telemetry.module.gpu.v1.IPowerCapCommand): telemetry.module.gpu.v1.PowerCapCommand;

                    /**
                     * Encodes the specified PowerCapCommand message. Does not implicitly {@link telemetry.module.gpu.v1.PowerCapCommand.verify|verify} messages.
                     * @param message PowerCapCommand message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: telemetry.module.gpu.v1.IPowerCapCommand, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified PowerCapCommand message, length delimited. Does not implicitly {@link telemetry.module.gpu.v1.PowerCapCommand.verify|verify} messages.
                     * @param message PowerCapCommand message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: telemetry.module.gpu.v1.IPowerCapCommand, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a PowerCapCommand message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns PowerCapCommand
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.module.gpu.v1.PowerCapCommand;

                    /**
                     * Decodes a PowerCapCommand message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns PowerCapCommand
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.module.gpu.v1.PowerCapCommand;

                    /**
                     * Verifies a PowerCapCommand message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a PowerCapCommand message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns PowerCapCommand
                     */
                    public static fromObject(object: { [k: string]: any }): telemetry.module.gpu.v1.PowerCapCommand;

                    /**
                     * Creates a plain object from a PowerCapCommand message. Also converts values to other types if specified.
                     * @param message PowerCapCommand
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: telemetry.module.gpu.v1.PowerCapCommand, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this PowerCapCommand to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };

                    /**
                     * Gets the default type url for PowerCapCommand
                     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns The default type url
                     */
                    public static getTypeUrl(typeUrlPrefix?: string): string;
                }
            }
        }

        /** Namespace memory. */
        namespace memory {

            /** Namespace v1. */
            namespace v1 {

                /** Properties of a CollectorSpec. */
                interface ICollectorSpec {

                    /** CollectorSpec category */
                    category?: (string|null);

                    /** CollectorSpec interval */
                    interval?: (string|null);
                }

                /** Represents a CollectorSpec. */
                class CollectorSpec implements ICollectorSpec {

                    /**
                     * Constructs a new CollectorSpec.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: telemetry.module.memory.v1.ICollectorSpec);

                    /** CollectorSpec category. */
                    public category: string;

                    /** CollectorSpec interval. */
                    public interval: string;

                    /**
                     * Creates a new CollectorSpec instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns CollectorSpec instance
                     */
                    public static create(properties?: telemetry.module.memory.v1.ICollectorSpec): telemetry.module.memory.v1.CollectorSpec;

                    /**
                     * Encodes the specified CollectorSpec message. Does not implicitly {@link telemetry.module.memory.v1.CollectorSpec.verify|verify} messages.
                     * @param message CollectorSpec message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: telemetry.module.memory.v1.ICollectorSpec, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified CollectorSpec message, length delimited. Does not implicitly {@link telemetry.module.memory.v1.CollectorSpec.verify|verify} messages.
                     * @param message CollectorSpec message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: telemetry.module.memory.v1.ICollectorSpec, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a CollectorSpec message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns CollectorSpec
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.module.memory.v1.CollectorSpec;

                    /**
                     * Decodes a CollectorSpec message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns CollectorSpec
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.module.memory.v1.CollectorSpec;

                    /**
                     * Verifies a CollectorSpec message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a CollectorSpec message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns CollectorSpec
                     */
                    public static fromObject(object: { [k: string]: any }): telemetry.module.memory.v1.CollectorSpec;

                    /**
                     * Creates a plain object from a CollectorSpec message. Also converts values to other types if specified.
                     * @param message CollectorSpec
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: telemetry.module.memory.v1.CollectorSpec, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this CollectorSpec to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };

                    /**
                     * Gets the default type url for CollectorSpec
                     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns The default type url
                     */
                    public static getTypeUrl(typeUrlPrefix?: string): string;
                }

                /** Properties of a StaticInfo. */
                interface IStaticInfo {

                    /** StaticInfo totalBytes */
                    totalBytes?: (number|Long|null);
                }

                /** Represents a StaticInfo. */
                class StaticInfo implements IStaticInfo {

                    /**
                     * Constructs a new StaticInfo.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: telemetry.module.memory.v1.IStaticInfo);

                    /** StaticInfo totalBytes. */
                    public totalBytes: (number|Long);

                    /**
                     * Creates a new StaticInfo instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns StaticInfo instance
                     */
                    public static create(properties?: telemetry.module.memory.v1.IStaticInfo): telemetry.module.memory.v1.StaticInfo;

                    /**
                     * Encodes the specified StaticInfo message. Does not implicitly {@link telemetry.module.memory.v1.StaticInfo.verify|verify} messages.
                     * @param message StaticInfo message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: telemetry.module.memory.v1.IStaticInfo, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified StaticInfo message, length delimited. Does not implicitly {@link telemetry.module.memory.v1.StaticInfo.verify|verify} messages.
                     * @param message StaticInfo message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: telemetry.module.memory.v1.IStaticInfo, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a StaticInfo message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns StaticInfo
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.module.memory.v1.StaticInfo;

                    /**
                     * Decodes a StaticInfo message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns StaticInfo
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.module.memory.v1.StaticInfo;

                    /**
                     * Verifies a StaticInfo message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a StaticInfo message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns StaticInfo
                     */
                    public static fromObject(object: { [k: string]: any }): telemetry.module.memory.v1.StaticInfo;

                    /**
                     * Creates a plain object from a StaticInfo message. Also converts values to other types if specified.
                     * @param message StaticInfo
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: telemetry.module.memory.v1.StaticInfo, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this StaticInfo to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };

                    /**
                     * Gets the default type url for StaticInfo
                     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns The default type url
                     */
                    public static getTypeUrl(typeUrlPrefix?: string): string;
                }

                /** Properties of a ModuleRegistration. */
                interface IModuleRegistration {

                    /** ModuleRegistration static */
                    "static"?: (telemetry.module.memory.v1.IStaticInfo|null);

                    /** ModuleRegistration collectors */
                    collectors?: (telemetry.module.memory.v1.ICollectorSpec[]|null);
                }

                /** Represents a ModuleRegistration. */
                class ModuleRegistration implements IModuleRegistration {

                    /**
                     * Constructs a new ModuleRegistration.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: telemetry.module.memory.v1.IModuleRegistration);

                    /** ModuleRegistration static. */
                    public static?: (telemetry.module.memory.v1.IStaticInfo|null);

                    /** ModuleRegistration collectors. */
                    public collectors: telemetry.module.memory.v1.ICollectorSpec[];

                    /**
                     * Creates a new ModuleRegistration instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns ModuleRegistration instance
                     */
                    public static create(properties?: telemetry.module.memory.v1.IModuleRegistration): telemetry.module.memory.v1.ModuleRegistration;

                    /**
                     * Encodes the specified ModuleRegistration message. Does not implicitly {@link telemetry.module.memory.v1.ModuleRegistration.verify|verify} messages.
                     * @param message ModuleRegistration message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: telemetry.module.memory.v1.IModuleRegistration, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified ModuleRegistration message, length delimited. Does not implicitly {@link telemetry.module.memory.v1.ModuleRegistration.verify|verify} messages.
                     * @param message ModuleRegistration message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: telemetry.module.memory.v1.IModuleRegistration, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a ModuleRegistration message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns ModuleRegistration
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.module.memory.v1.ModuleRegistration;

                    /**
                     * Decodes a ModuleRegistration message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns ModuleRegistration
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.module.memory.v1.ModuleRegistration;

                    /**
                     * Verifies a ModuleRegistration message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a ModuleRegistration message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns ModuleRegistration
                     */
                    public static fromObject(object: { [k: string]: any }): telemetry.module.memory.v1.ModuleRegistration;

                    /**
                     * Creates a plain object from a ModuleRegistration message. Also converts values to other types if specified.
                     * @param message ModuleRegistration
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: telemetry.module.memory.v1.ModuleRegistration, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this ModuleRegistration to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };

                    /**
                     * Gets the default type url for ModuleRegistration
                     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns The default type url
                     */
                    public static getTypeUrl(typeUrlPrefix?: string): string;
                }

                /** Properties of a Metrics. */
                interface IMetrics {

                    /** Metrics usedBytes */
                    usedBytes?: (number|Long|null);

                    /** Metrics freeBytes */
                    freeBytes?: (number|Long|null);

                    /** Metrics availableBytes */
                    availableBytes?: (number|Long|null);

                    /** Metrics cachedBytes */
                    cachedBytes?: (number|Long|null);

                    /** Metrics buffersBytes */
                    buffersBytes?: (number|Long|null);

                    /** Metrics sampledAtUnixNano */
                    sampledAtUnixNano?: (number|Long|null);
                }

                /** Represents a Metrics. */
                class Metrics implements IMetrics {

                    /**
                     * Constructs a new Metrics.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: telemetry.module.memory.v1.IMetrics);

                    /** Metrics usedBytes. */
                    public usedBytes: (number|Long);

                    /** Metrics freeBytes. */
                    public freeBytes: (number|Long);

                    /** Metrics availableBytes. */
                    public availableBytes: (number|Long);

                    /** Metrics cachedBytes. */
                    public cachedBytes: (number|Long);

                    /** Metrics buffersBytes. */
                    public buffersBytes: (number|Long);

                    /** Metrics sampledAtUnixNano. */
                    public sampledAtUnixNano: (number|Long);

                    /**
                     * Creates a new Metrics instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns Metrics instance
                     */
                    public static create(properties?: telemetry.module.memory.v1.IMetrics): telemetry.module.memory.v1.Metrics;

                    /**
                     * Encodes the specified Metrics message. Does not implicitly {@link telemetry.module.memory.v1.Metrics.verify|verify} messages.
                     * @param message Metrics message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: telemetry.module.memory.v1.IMetrics, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified Metrics message, length delimited. Does not implicitly {@link telemetry.module.memory.v1.Metrics.verify|verify} messages.
                     * @param message Metrics message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: telemetry.module.memory.v1.IMetrics, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a Metrics message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns Metrics
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.module.memory.v1.Metrics;

                    /**
                     * Decodes a Metrics message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns Metrics
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.module.memory.v1.Metrics;

                    /**
                     * Verifies a Metrics message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a Metrics message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns Metrics
                     */
                    public static fromObject(object: { [k: string]: any }): telemetry.module.memory.v1.Metrics;

                    /**
                     * Creates a plain object from a Metrics message. Also converts values to other types if specified.
                     * @param message Metrics
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: telemetry.module.memory.v1.Metrics, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this Metrics to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };

                    /**
                     * Gets the default type url for Metrics
                     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns The default type url
                     */
                    public static getTypeUrl(typeUrlPrefix?: string): string;
                }
            }
        }

        /** Namespace storage. */
        namespace storage {

            /** Namespace v1. */
            namespace v1 {

                /** Properties of a CollectorSpec. */
                interface ICollectorSpec {

                    /** CollectorSpec category */
                    category?: (string|null);

                    /** CollectorSpec interval */
                    interval?: (string|null);
                }

                /** Represents a CollectorSpec. */
                class CollectorSpec implements ICollectorSpec {

                    /**
                     * Constructs a new CollectorSpec.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: telemetry.module.storage.v1.ICollectorSpec);

                    /** CollectorSpec category. */
                    public category: string;

                    /** CollectorSpec interval. */
                    public interval: string;

                    /**
                     * Creates a new CollectorSpec instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns CollectorSpec instance
                     */
                    public static create(properties?: telemetry.module.storage.v1.ICollectorSpec): telemetry.module.storage.v1.CollectorSpec;

                    /**
                     * Encodes the specified CollectorSpec message. Does not implicitly {@link telemetry.module.storage.v1.CollectorSpec.verify|verify} messages.
                     * @param message CollectorSpec message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: telemetry.module.storage.v1.ICollectorSpec, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified CollectorSpec message, length delimited. Does not implicitly {@link telemetry.module.storage.v1.CollectorSpec.verify|verify} messages.
                     * @param message CollectorSpec message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: telemetry.module.storage.v1.ICollectorSpec, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a CollectorSpec message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns CollectorSpec
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.module.storage.v1.CollectorSpec;

                    /**
                     * Decodes a CollectorSpec message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns CollectorSpec
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.module.storage.v1.CollectorSpec;

                    /**
                     * Verifies a CollectorSpec message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a CollectorSpec message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns CollectorSpec
                     */
                    public static fromObject(object: { [k: string]: any }): telemetry.module.storage.v1.CollectorSpec;

                    /**
                     * Creates a plain object from a CollectorSpec message. Also converts values to other types if specified.
                     * @param message CollectorSpec
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: telemetry.module.storage.v1.CollectorSpec, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this CollectorSpec to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };

                    /**
                     * Gets the default type url for CollectorSpec
                     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns The default type url
                     */
                    public static getTypeUrl(typeUrlPrefix?: string): string;
                }

                /** Properties of a StaticDiskInfo. */
                interface IStaticDiskInfo {

                    /** StaticDiskInfo name */
                    name?: (string|null);

                    /** StaticDiskInfo mountpoint */
                    mountpoint?: (string|null);

                    /** StaticDiskInfo filesystem */
                    filesystem?: (string|null);

                    /** StaticDiskInfo totalBytes */
                    totalBytes?: (number|Long|null);
                }

                /** Represents a StaticDiskInfo. */
                class StaticDiskInfo implements IStaticDiskInfo {

                    /**
                     * Constructs a new StaticDiskInfo.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: telemetry.module.storage.v1.IStaticDiskInfo);

                    /** StaticDiskInfo name. */
                    public name: string;

                    /** StaticDiskInfo mountpoint. */
                    public mountpoint: string;

                    /** StaticDiskInfo filesystem. */
                    public filesystem: string;

                    /** StaticDiskInfo totalBytes. */
                    public totalBytes: (number|Long);

                    /**
                     * Creates a new StaticDiskInfo instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns StaticDiskInfo instance
                     */
                    public static create(properties?: telemetry.module.storage.v1.IStaticDiskInfo): telemetry.module.storage.v1.StaticDiskInfo;

                    /**
                     * Encodes the specified StaticDiskInfo message. Does not implicitly {@link telemetry.module.storage.v1.StaticDiskInfo.verify|verify} messages.
                     * @param message StaticDiskInfo message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: telemetry.module.storage.v1.IStaticDiskInfo, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified StaticDiskInfo message, length delimited. Does not implicitly {@link telemetry.module.storage.v1.StaticDiskInfo.verify|verify} messages.
                     * @param message StaticDiskInfo message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: telemetry.module.storage.v1.IStaticDiskInfo, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a StaticDiskInfo message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns StaticDiskInfo
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.module.storage.v1.StaticDiskInfo;

                    /**
                     * Decodes a StaticDiskInfo message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns StaticDiskInfo
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.module.storage.v1.StaticDiskInfo;

                    /**
                     * Verifies a StaticDiskInfo message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a StaticDiskInfo message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns StaticDiskInfo
                     */
                    public static fromObject(object: { [k: string]: any }): telemetry.module.storage.v1.StaticDiskInfo;

                    /**
                     * Creates a plain object from a StaticDiskInfo message. Also converts values to other types if specified.
                     * @param message StaticDiskInfo
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: telemetry.module.storage.v1.StaticDiskInfo, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this StaticDiskInfo to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };

                    /**
                     * Gets the default type url for StaticDiskInfo
                     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns The default type url
                     */
                    public static getTypeUrl(typeUrlPrefix?: string): string;
                }

                /** Properties of a ModuleRegistration. */
                interface IModuleRegistration {

                    /** ModuleRegistration collectors */
                    collectors?: (telemetry.module.storage.v1.ICollectorSpec[]|null);

                    /** ModuleRegistration staticDisks */
                    staticDisks?: (telemetry.module.storage.v1.IStaticDiskInfo[]|null);
                }

                /** Represents a ModuleRegistration. */
                class ModuleRegistration implements IModuleRegistration {

                    /**
                     * Constructs a new ModuleRegistration.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: telemetry.module.storage.v1.IModuleRegistration);

                    /** ModuleRegistration collectors. */
                    public collectors: telemetry.module.storage.v1.ICollectorSpec[];

                    /** ModuleRegistration staticDisks. */
                    public staticDisks: telemetry.module.storage.v1.IStaticDiskInfo[];

                    /**
                     * Creates a new ModuleRegistration instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns ModuleRegistration instance
                     */
                    public static create(properties?: telemetry.module.storage.v1.IModuleRegistration): telemetry.module.storage.v1.ModuleRegistration;

                    /**
                     * Encodes the specified ModuleRegistration message. Does not implicitly {@link telemetry.module.storage.v1.ModuleRegistration.verify|verify} messages.
                     * @param message ModuleRegistration message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: telemetry.module.storage.v1.IModuleRegistration, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified ModuleRegistration message, length delimited. Does not implicitly {@link telemetry.module.storage.v1.ModuleRegistration.verify|verify} messages.
                     * @param message ModuleRegistration message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: telemetry.module.storage.v1.IModuleRegistration, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a ModuleRegistration message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns ModuleRegistration
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.module.storage.v1.ModuleRegistration;

                    /**
                     * Decodes a ModuleRegistration message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns ModuleRegistration
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.module.storage.v1.ModuleRegistration;

                    /**
                     * Verifies a ModuleRegistration message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a ModuleRegistration message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns ModuleRegistration
                     */
                    public static fromObject(object: { [k: string]: any }): telemetry.module.storage.v1.ModuleRegistration;

                    /**
                     * Creates a plain object from a ModuleRegistration message. Also converts values to other types if specified.
                     * @param message ModuleRegistration
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: telemetry.module.storage.v1.ModuleRegistration, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this ModuleRegistration to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };

                    /**
                     * Gets the default type url for ModuleRegistration
                     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns The default type url
                     */
                    public static getTypeUrl(typeUrlPrefix?: string): string;
                }

                /** Properties of a DiskMetrics. */
                interface IDiskMetrics {

                    /** DiskMetrics name */
                    name?: (string|null);

                    /** DiskMetrics usedBytes */
                    usedBytes?: (number|Long|null);

                    /** DiskMetrics freeBytes */
                    freeBytes?: (number|Long|null);

                    /** DiskMetrics readSectors */
                    readSectors?: (number|Long|null);

                    /** DiskMetrics writeSectors */
                    writeSectors?: (number|Long|null);

                    /** DiskMetrics readIos */
                    readIos?: (number|Long|null);

                    /** DiskMetrics writeIos */
                    writeIos?: (number|Long|null);

                    /** DiskMetrics sampledAtUnixNano */
                    sampledAtUnixNano?: (number|Long|null);
                }

                /** Represents a DiskMetrics. */
                class DiskMetrics implements IDiskMetrics {

                    /**
                     * Constructs a new DiskMetrics.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: telemetry.module.storage.v1.IDiskMetrics);

                    /** DiskMetrics name. */
                    public name: string;

                    /** DiskMetrics usedBytes. */
                    public usedBytes: (number|Long);

                    /** DiskMetrics freeBytes. */
                    public freeBytes: (number|Long);

                    /** DiskMetrics readSectors. */
                    public readSectors: (number|Long);

                    /** DiskMetrics writeSectors. */
                    public writeSectors: (number|Long);

                    /** DiskMetrics readIos. */
                    public readIos: (number|Long);

                    /** DiskMetrics writeIos. */
                    public writeIos: (number|Long);

                    /** DiskMetrics sampledAtUnixNano. */
                    public sampledAtUnixNano: (number|Long);

                    /**
                     * Creates a new DiskMetrics instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns DiskMetrics instance
                     */
                    public static create(properties?: telemetry.module.storage.v1.IDiskMetrics): telemetry.module.storage.v1.DiskMetrics;

                    /**
                     * Encodes the specified DiskMetrics message. Does not implicitly {@link telemetry.module.storage.v1.DiskMetrics.verify|verify} messages.
                     * @param message DiskMetrics message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: telemetry.module.storage.v1.IDiskMetrics, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified DiskMetrics message, length delimited. Does not implicitly {@link telemetry.module.storage.v1.DiskMetrics.verify|verify} messages.
                     * @param message DiskMetrics message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: telemetry.module.storage.v1.IDiskMetrics, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a DiskMetrics message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns DiskMetrics
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.module.storage.v1.DiskMetrics;

                    /**
                     * Decodes a DiskMetrics message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns DiskMetrics
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.module.storage.v1.DiskMetrics;

                    /**
                     * Verifies a DiskMetrics message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a DiskMetrics message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns DiskMetrics
                     */
                    public static fromObject(object: { [k: string]: any }): telemetry.module.storage.v1.DiskMetrics;

                    /**
                     * Creates a plain object from a DiskMetrics message. Also converts values to other types if specified.
                     * @param message DiskMetrics
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: telemetry.module.storage.v1.DiskMetrics, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this DiskMetrics to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };

                    /**
                     * Gets the default type url for DiskMetrics
                     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns The default type url
                     */
                    public static getTypeUrl(typeUrlPrefix?: string): string;
                }

                /** Properties of a Metrics. */
                interface IMetrics {

                    /** Metrics disks */
                    disks?: (telemetry.module.storage.v1.IDiskMetrics[]|null);
                }

                /** Represents a Metrics. */
                class Metrics implements IMetrics {

                    /**
                     * Constructs a new Metrics.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: telemetry.module.storage.v1.IMetrics);

                    /** Metrics disks. */
                    public disks: telemetry.module.storage.v1.IDiskMetrics[];

                    /**
                     * Creates a new Metrics instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns Metrics instance
                     */
                    public static create(properties?: telemetry.module.storage.v1.IMetrics): telemetry.module.storage.v1.Metrics;

                    /**
                     * Encodes the specified Metrics message. Does not implicitly {@link telemetry.module.storage.v1.Metrics.verify|verify} messages.
                     * @param message Metrics message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: telemetry.module.storage.v1.IMetrics, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified Metrics message, length delimited. Does not implicitly {@link telemetry.module.storage.v1.Metrics.verify|verify} messages.
                     * @param message Metrics message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: telemetry.module.storage.v1.IMetrics, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a Metrics message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns Metrics
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.module.storage.v1.Metrics;

                    /**
                     * Decodes a Metrics message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns Metrics
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.module.storage.v1.Metrics;

                    /**
                     * Verifies a Metrics message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a Metrics message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns Metrics
                     */
                    public static fromObject(object: { [k: string]: any }): telemetry.module.storage.v1.Metrics;

                    /**
                     * Creates a plain object from a Metrics message. Also converts values to other types if specified.
                     * @param message Metrics
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: telemetry.module.storage.v1.Metrics, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this Metrics to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };

                    /**
                     * Gets the default type url for Metrics
                     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns The default type url
                     */
                    public static getTypeUrl(typeUrlPrefix?: string): string;
                }
            }
        }

        /** Namespace network. */
        namespace network {

            /** Namespace v1. */
            namespace v1 {

                /** Properties of a CollectorSpec. */
                interface ICollectorSpec {

                    /** CollectorSpec category */
                    category?: (string|null);

                    /** CollectorSpec interval */
                    interval?: (string|null);
                }

                /** Represents a CollectorSpec. */
                class CollectorSpec implements ICollectorSpec {

                    /**
                     * Constructs a new CollectorSpec.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: telemetry.module.network.v1.ICollectorSpec);

                    /** CollectorSpec category. */
                    public category: string;

                    /** CollectorSpec interval. */
                    public interval: string;

                    /**
                     * Creates a new CollectorSpec instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns CollectorSpec instance
                     */
                    public static create(properties?: telemetry.module.network.v1.ICollectorSpec): telemetry.module.network.v1.CollectorSpec;

                    /**
                     * Encodes the specified CollectorSpec message. Does not implicitly {@link telemetry.module.network.v1.CollectorSpec.verify|verify} messages.
                     * @param message CollectorSpec message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: telemetry.module.network.v1.ICollectorSpec, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified CollectorSpec message, length delimited. Does not implicitly {@link telemetry.module.network.v1.CollectorSpec.verify|verify} messages.
                     * @param message CollectorSpec message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: telemetry.module.network.v1.ICollectorSpec, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a CollectorSpec message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns CollectorSpec
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.module.network.v1.CollectorSpec;

                    /**
                     * Decodes a CollectorSpec message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns CollectorSpec
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.module.network.v1.CollectorSpec;

                    /**
                     * Verifies a CollectorSpec message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a CollectorSpec message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns CollectorSpec
                     */
                    public static fromObject(object: { [k: string]: any }): telemetry.module.network.v1.CollectorSpec;

                    /**
                     * Creates a plain object from a CollectorSpec message. Also converts values to other types if specified.
                     * @param message CollectorSpec
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: telemetry.module.network.v1.CollectorSpec, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this CollectorSpec to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };

                    /**
                     * Gets the default type url for CollectorSpec
                     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns The default type url
                     */
                    public static getTypeUrl(typeUrlPrefix?: string): string;
                }

                /** Properties of a ModuleRegistration. */
                interface IModuleRegistration {

                    /** ModuleRegistration collectors */
                    collectors?: (telemetry.module.network.v1.ICollectorSpec[]|null);
                }

                /** Represents a ModuleRegistration. */
                class ModuleRegistration implements IModuleRegistration {

                    /**
                     * Constructs a new ModuleRegistration.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: telemetry.module.network.v1.IModuleRegistration);

                    /** ModuleRegistration collectors. */
                    public collectors: telemetry.module.network.v1.ICollectorSpec[];

                    /**
                     * Creates a new ModuleRegistration instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns ModuleRegistration instance
                     */
                    public static create(properties?: telemetry.module.network.v1.IModuleRegistration): telemetry.module.network.v1.ModuleRegistration;

                    /**
                     * Encodes the specified ModuleRegistration message. Does not implicitly {@link telemetry.module.network.v1.ModuleRegistration.verify|verify} messages.
                     * @param message ModuleRegistration message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: telemetry.module.network.v1.IModuleRegistration, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified ModuleRegistration message, length delimited. Does not implicitly {@link telemetry.module.network.v1.ModuleRegistration.verify|verify} messages.
                     * @param message ModuleRegistration message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: telemetry.module.network.v1.IModuleRegistration, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a ModuleRegistration message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns ModuleRegistration
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.module.network.v1.ModuleRegistration;

                    /**
                     * Decodes a ModuleRegistration message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns ModuleRegistration
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.module.network.v1.ModuleRegistration;

                    /**
                     * Verifies a ModuleRegistration message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a ModuleRegistration message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns ModuleRegistration
                     */
                    public static fromObject(object: { [k: string]: any }): telemetry.module.network.v1.ModuleRegistration;

                    /**
                     * Creates a plain object from a ModuleRegistration message. Also converts values to other types if specified.
                     * @param message ModuleRegistration
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: telemetry.module.network.v1.ModuleRegistration, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this ModuleRegistration to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };

                    /**
                     * Gets the default type url for ModuleRegistration
                     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns The default type url
                     */
                    public static getTypeUrl(typeUrlPrefix?: string): string;
                }

                /** Properties of an InterfaceMetrics. */
                interface IInterfaceMetrics {

                    /** InterfaceMetrics name */
                    name?: (string|null);

                    /** InterfaceMetrics ips */
                    ips?: (string[]|null);

                    /** InterfaceMetrics rxBytes */
                    rxBytes?: (number|Long|null);

                    /** InterfaceMetrics rxPackets */
                    rxPackets?: (number|Long|null);

                    /** InterfaceMetrics txBytes */
                    txBytes?: (number|Long|null);

                    /** InterfaceMetrics txPackets */
                    txPackets?: (number|Long|null);

                    /** InterfaceMetrics sampledAtUnixNano */
                    sampledAtUnixNano?: (number|Long|null);
                }

                /** Represents an InterfaceMetrics. */
                class InterfaceMetrics implements IInterfaceMetrics {

                    /**
                     * Constructs a new InterfaceMetrics.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: telemetry.module.network.v1.IInterfaceMetrics);

                    /** InterfaceMetrics name. */
                    public name: string;

                    /** InterfaceMetrics ips. */
                    public ips: string[];

                    /** InterfaceMetrics rxBytes. */
                    public rxBytes: (number|Long);

                    /** InterfaceMetrics rxPackets. */
                    public rxPackets: (number|Long);

                    /** InterfaceMetrics txBytes. */
                    public txBytes: (number|Long);

                    /** InterfaceMetrics txPackets. */
                    public txPackets: (number|Long);

                    /** InterfaceMetrics sampledAtUnixNano. */
                    public sampledAtUnixNano: (number|Long);

                    /**
                     * Creates a new InterfaceMetrics instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns InterfaceMetrics instance
                     */
                    public static create(properties?: telemetry.module.network.v1.IInterfaceMetrics): telemetry.module.network.v1.InterfaceMetrics;

                    /**
                     * Encodes the specified InterfaceMetrics message. Does not implicitly {@link telemetry.module.network.v1.InterfaceMetrics.verify|verify} messages.
                     * @param message InterfaceMetrics message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: telemetry.module.network.v1.IInterfaceMetrics, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified InterfaceMetrics message, length delimited. Does not implicitly {@link telemetry.module.network.v1.InterfaceMetrics.verify|verify} messages.
                     * @param message InterfaceMetrics message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: telemetry.module.network.v1.IInterfaceMetrics, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes an InterfaceMetrics message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns InterfaceMetrics
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.module.network.v1.InterfaceMetrics;

                    /**
                     * Decodes an InterfaceMetrics message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns InterfaceMetrics
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.module.network.v1.InterfaceMetrics;

                    /**
                     * Verifies an InterfaceMetrics message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates an InterfaceMetrics message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns InterfaceMetrics
                     */
                    public static fromObject(object: { [k: string]: any }): telemetry.module.network.v1.InterfaceMetrics;

                    /**
                     * Creates a plain object from an InterfaceMetrics message. Also converts values to other types if specified.
                     * @param message InterfaceMetrics
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: telemetry.module.network.v1.InterfaceMetrics, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this InterfaceMetrics to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };

                    /**
                     * Gets the default type url for InterfaceMetrics
                     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns The default type url
                     */
                    public static getTypeUrl(typeUrlPrefix?: string): string;
                }

                /** Properties of a Metrics. */
                interface IMetrics {

                    /** Metrics interfaces */
                    interfaces?: (telemetry.module.network.v1.IInterfaceMetrics[]|null);
                }

                /** Represents a Metrics. */
                class Metrics implements IMetrics {

                    /**
                     * Constructs a new Metrics.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: telemetry.module.network.v1.IMetrics);

                    /** Metrics interfaces. */
                    public interfaces: telemetry.module.network.v1.IInterfaceMetrics[];

                    /**
                     * Creates a new Metrics instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns Metrics instance
                     */
                    public static create(properties?: telemetry.module.network.v1.IMetrics): telemetry.module.network.v1.Metrics;

                    /**
                     * Encodes the specified Metrics message. Does not implicitly {@link telemetry.module.network.v1.Metrics.verify|verify} messages.
                     * @param message Metrics message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: telemetry.module.network.v1.IMetrics, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified Metrics message, length delimited. Does not implicitly {@link telemetry.module.network.v1.Metrics.verify|verify} messages.
                     * @param message Metrics message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: telemetry.module.network.v1.IMetrics, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a Metrics message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns Metrics
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.module.network.v1.Metrics;

                    /**
                     * Decodes a Metrics message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns Metrics
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.module.network.v1.Metrics;

                    /**
                     * Verifies a Metrics message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a Metrics message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns Metrics
                     */
                    public static fromObject(object: { [k: string]: any }): telemetry.module.network.v1.Metrics;

                    /**
                     * Creates a plain object from a Metrics message. Also converts values to other types if specified.
                     * @param message Metrics
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: telemetry.module.network.v1.Metrics, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this Metrics to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };

                    /**
                     * Gets the default type url for Metrics
                     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns The default type url
                     */
                    public static getTypeUrl(typeUrlPrefix?: string): string;
                }
            }
        }

        /** Namespace process. */
        namespace process {

            /** Namespace v1. */
            namespace v1 {

                /** Properties of a CollectorSpec. */
                interface ICollectorSpec {

                    /** CollectorSpec category */
                    category?: (string|null);

                    /** CollectorSpec interval */
                    interval?: (string|null);
                }

                /** Represents a CollectorSpec. */
                class CollectorSpec implements ICollectorSpec {

                    /**
                     * Constructs a new CollectorSpec.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: telemetry.module.process.v1.ICollectorSpec);

                    /** CollectorSpec category. */
                    public category: string;

                    /** CollectorSpec interval. */
                    public interval: string;

                    /**
                     * Creates a new CollectorSpec instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns CollectorSpec instance
                     */
                    public static create(properties?: telemetry.module.process.v1.ICollectorSpec): telemetry.module.process.v1.CollectorSpec;

                    /**
                     * Encodes the specified CollectorSpec message. Does not implicitly {@link telemetry.module.process.v1.CollectorSpec.verify|verify} messages.
                     * @param message CollectorSpec message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: telemetry.module.process.v1.ICollectorSpec, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified CollectorSpec message, length delimited. Does not implicitly {@link telemetry.module.process.v1.CollectorSpec.verify|verify} messages.
                     * @param message CollectorSpec message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: telemetry.module.process.v1.ICollectorSpec, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a CollectorSpec message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns CollectorSpec
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.module.process.v1.CollectorSpec;

                    /**
                     * Decodes a CollectorSpec message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns CollectorSpec
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.module.process.v1.CollectorSpec;

                    /**
                     * Verifies a CollectorSpec message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a CollectorSpec message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns CollectorSpec
                     */
                    public static fromObject(object: { [k: string]: any }): telemetry.module.process.v1.CollectorSpec;

                    /**
                     * Creates a plain object from a CollectorSpec message. Also converts values to other types if specified.
                     * @param message CollectorSpec
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: telemetry.module.process.v1.CollectorSpec, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this CollectorSpec to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };

                    /**
                     * Gets the default type url for CollectorSpec
                     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns The default type url
                     */
                    public static getTypeUrl(typeUrlPrefix?: string): string;
                }

                /** Properties of a ControllerSpec. */
                interface IControllerSpec {

                    /** ControllerSpec type */
                    type?: (string|null);
                }

                /** Represents a ControllerSpec. */
                class ControllerSpec implements IControllerSpec {

                    /**
                     * Constructs a new ControllerSpec.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: telemetry.module.process.v1.IControllerSpec);

                    /** ControllerSpec type. */
                    public type: string;

                    /**
                     * Creates a new ControllerSpec instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns ControllerSpec instance
                     */
                    public static create(properties?: telemetry.module.process.v1.IControllerSpec): telemetry.module.process.v1.ControllerSpec;

                    /**
                     * Encodes the specified ControllerSpec message. Does not implicitly {@link telemetry.module.process.v1.ControllerSpec.verify|verify} messages.
                     * @param message ControllerSpec message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: telemetry.module.process.v1.IControllerSpec, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified ControllerSpec message, length delimited. Does not implicitly {@link telemetry.module.process.v1.ControllerSpec.verify|verify} messages.
                     * @param message ControllerSpec message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: telemetry.module.process.v1.IControllerSpec, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a ControllerSpec message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns ControllerSpec
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.module.process.v1.ControllerSpec;

                    /**
                     * Decodes a ControllerSpec message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns ControllerSpec
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.module.process.v1.ControllerSpec;

                    /**
                     * Verifies a ControllerSpec message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a ControllerSpec message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns ControllerSpec
                     */
                    public static fromObject(object: { [k: string]: any }): telemetry.module.process.v1.ControllerSpec;

                    /**
                     * Creates a plain object from a ControllerSpec message. Also converts values to other types if specified.
                     * @param message ControllerSpec
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: telemetry.module.process.v1.ControllerSpec, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this ControllerSpec to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };

                    /**
                     * Gets the default type url for ControllerSpec
                     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns The default type url
                     */
                    public static getTypeUrl(typeUrlPrefix?: string): string;
                }

                /** Properties of a ModuleRegistration. */
                interface IModuleRegistration {

                    /** ModuleRegistration collectors */
                    collectors?: (telemetry.module.process.v1.ICollectorSpec[]|null);

                    /** ModuleRegistration controllers */
                    controllers?: (telemetry.module.process.v1.IControllerSpec[]|null);
                }

                /** Represents a ModuleRegistration. */
                class ModuleRegistration implements IModuleRegistration {

                    /**
                     * Constructs a new ModuleRegistration.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: telemetry.module.process.v1.IModuleRegistration);

                    /** ModuleRegistration collectors. */
                    public collectors: telemetry.module.process.v1.ICollectorSpec[];

                    /** ModuleRegistration controllers. */
                    public controllers: telemetry.module.process.v1.IControllerSpec[];

                    /**
                     * Creates a new ModuleRegistration instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns ModuleRegistration instance
                     */
                    public static create(properties?: telemetry.module.process.v1.IModuleRegistration): telemetry.module.process.v1.ModuleRegistration;

                    /**
                     * Encodes the specified ModuleRegistration message. Does not implicitly {@link telemetry.module.process.v1.ModuleRegistration.verify|verify} messages.
                     * @param message ModuleRegistration message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: telemetry.module.process.v1.IModuleRegistration, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified ModuleRegistration message, length delimited. Does not implicitly {@link telemetry.module.process.v1.ModuleRegistration.verify|verify} messages.
                     * @param message ModuleRegistration message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: telemetry.module.process.v1.IModuleRegistration, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a ModuleRegistration message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns ModuleRegistration
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.module.process.v1.ModuleRegistration;

                    /**
                     * Decodes a ModuleRegistration message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns ModuleRegistration
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.module.process.v1.ModuleRegistration;

                    /**
                     * Verifies a ModuleRegistration message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a ModuleRegistration message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns ModuleRegistration
                     */
                    public static fromObject(object: { [k: string]: any }): telemetry.module.process.v1.ModuleRegistration;

                    /**
                     * Creates a plain object from a ModuleRegistration message. Also converts values to other types if specified.
                     * @param message ModuleRegistration
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: telemetry.module.process.v1.ModuleRegistration, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this ModuleRegistration to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };

                    /**
                     * Gets the default type url for ModuleRegistration
                     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns The default type url
                     */
                    public static getTypeUrl(typeUrlPrefix?: string): string;
                }

                /** Properties of an Info. */
                interface IInfo {

                    /** Info pid */
                    pid?: (number|null);

                    /** Info ppid */
                    ppid?: (number|null);

                    /** Info user */
                    user?: (string|null);

                    /** Info state */
                    state?: (string|null);

                    /** Info cpuPercent */
                    cpuPercent?: (number|null);

                    /** Info memoryBytes */
                    memoryBytes?: (number|Long|null);

                    /** Info command */
                    command?: (string|null);

                    /** Info sampledAtUnixNano */
                    sampledAtUnixNano?: (number|Long|null);
                }

                /** Represents an Info. */
                class Info implements IInfo {

                    /**
                     * Constructs a new Info.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: telemetry.module.process.v1.IInfo);

                    /** Info pid. */
                    public pid: number;

                    /** Info ppid. */
                    public ppid: number;

                    /** Info user. */
                    public user: string;

                    /** Info state. */
                    public state: string;

                    /** Info cpuPercent. */
                    public cpuPercent: number;

                    /** Info memoryBytes. */
                    public memoryBytes: (number|Long);

                    /** Info command. */
                    public command: string;

                    /** Info sampledAtUnixNano. */
                    public sampledAtUnixNano: (number|Long);

                    /**
                     * Creates a new Info instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns Info instance
                     */
                    public static create(properties?: telemetry.module.process.v1.IInfo): telemetry.module.process.v1.Info;

                    /**
                     * Encodes the specified Info message. Does not implicitly {@link telemetry.module.process.v1.Info.verify|verify} messages.
                     * @param message Info message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: telemetry.module.process.v1.IInfo, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified Info message, length delimited. Does not implicitly {@link telemetry.module.process.v1.Info.verify|verify} messages.
                     * @param message Info message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: telemetry.module.process.v1.IInfo, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes an Info message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns Info
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.module.process.v1.Info;

                    /**
                     * Decodes an Info message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns Info
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.module.process.v1.Info;

                    /**
                     * Verifies an Info message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates an Info message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns Info
                     */
                    public static fromObject(object: { [k: string]: any }): telemetry.module.process.v1.Info;

                    /**
                     * Creates a plain object from an Info message. Also converts values to other types if specified.
                     * @param message Info
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: telemetry.module.process.v1.Info, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this Info to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };

                    /**
                     * Gets the default type url for Info
                     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns The default type url
                     */
                    public static getTypeUrl(typeUrlPrefix?: string): string;
                }

                /** Properties of a Metrics. */
                interface IMetrics {

                    /** Metrics processes */
                    processes?: (telemetry.module.process.v1.IInfo[]|null);
                }

                /** Represents a Metrics. */
                class Metrics implements IMetrics {

                    /**
                     * Constructs a new Metrics.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: telemetry.module.process.v1.IMetrics);

                    /** Metrics processes. */
                    public processes: telemetry.module.process.v1.IInfo[];

                    /**
                     * Creates a new Metrics instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns Metrics instance
                     */
                    public static create(properties?: telemetry.module.process.v1.IMetrics): telemetry.module.process.v1.Metrics;

                    /**
                     * Encodes the specified Metrics message. Does not implicitly {@link telemetry.module.process.v1.Metrics.verify|verify} messages.
                     * @param message Metrics message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: telemetry.module.process.v1.IMetrics, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified Metrics message, length delimited. Does not implicitly {@link telemetry.module.process.v1.Metrics.verify|verify} messages.
                     * @param message Metrics message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: telemetry.module.process.v1.IMetrics, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a Metrics message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns Metrics
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.module.process.v1.Metrics;

                    /**
                     * Decodes a Metrics message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns Metrics
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.module.process.v1.Metrics;

                    /**
                     * Verifies a Metrics message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a Metrics message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns Metrics
                     */
                    public static fromObject(object: { [k: string]: any }): telemetry.module.process.v1.Metrics;

                    /**
                     * Creates a plain object from a Metrics message. Also converts values to other types if specified.
                     * @param message Metrics
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: telemetry.module.process.v1.Metrics, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this Metrics to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };

                    /**
                     * Gets the default type url for Metrics
                     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns The default type url
                     */
                    public static getTypeUrl(typeUrlPrefix?: string): string;
                }

                /** Properties of a SignalCommand. */
                interface ISignalCommand {

                    /** SignalCommand pid */
                    pid?: (number|null);

                    /** SignalCommand signal */
                    signal?: (number|null);
                }

                /** Represents a SignalCommand. */
                class SignalCommand implements ISignalCommand {

                    /**
                     * Constructs a new SignalCommand.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: telemetry.module.process.v1.ISignalCommand);

                    /** SignalCommand pid. */
                    public pid: number;

                    /** SignalCommand signal. */
                    public signal: number;

                    /**
                     * Creates a new SignalCommand instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns SignalCommand instance
                     */
                    public static create(properties?: telemetry.module.process.v1.ISignalCommand): telemetry.module.process.v1.SignalCommand;

                    /**
                     * Encodes the specified SignalCommand message. Does not implicitly {@link telemetry.module.process.v1.SignalCommand.verify|verify} messages.
                     * @param message SignalCommand message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: telemetry.module.process.v1.ISignalCommand, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified SignalCommand message, length delimited. Does not implicitly {@link telemetry.module.process.v1.SignalCommand.verify|verify} messages.
                     * @param message SignalCommand message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: telemetry.module.process.v1.ISignalCommand, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a SignalCommand message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns SignalCommand
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): telemetry.module.process.v1.SignalCommand;

                    /**
                     * Decodes a SignalCommand message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns SignalCommand
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): telemetry.module.process.v1.SignalCommand;

                    /**
                     * Verifies a SignalCommand message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a SignalCommand message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns SignalCommand
                     */
                    public static fromObject(object: { [k: string]: any }): telemetry.module.process.v1.SignalCommand;

                    /**
                     * Creates a plain object from a SignalCommand message. Also converts values to other types if specified.
                     * @param message SignalCommand
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: telemetry.module.process.v1.SignalCommand, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this SignalCommand to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };

                    /**
                     * Gets the default type url for SignalCommand
                     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns The default type url
                     */
                    public static getTypeUrl(typeUrlPrefix?: string): string;
                }
            }
        }
    }
}
