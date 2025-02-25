import type { CallTemplateFunctionArgs, Context, PluginDefinition } from "@yaakapp/api";

import { execSync } from "node:child_process";
import { JSONPath } from "jsonpath-plus";

export const plugin: PluginDefinition = {
    templateFunctions: [
        {
            name: "shell_command",
            description: "Run a shell command.",
            args: [
                {
                    type: "text",
                    name: "cmd",
                    label: "Command",
                },
                {
                    type: "select",
                    name: "interpreter",
                    label: "Shell Intepreter",
                    defaultValue: "/bin/sh",
                    options: [
                        { label: "Bash", value: "/bin/bash" },
                        { label: "Zsh", value: "/bin/zsh" },
                        { label: "sh", value: "/bin/sh" },
                    ],
                },
                {
                    type: "checkbox",
                    name: "json_validation",
                    label: "Validate JSON Return Value",
                    defaultValue: "false",
                },
                {
                    type: "text",
                    name: "json_filter",
                    label: "JSONPath Filter",
                    optional: true,
                    placeholder: "$..",
                },
            ],
            onRender: async (
                ctx: Context,
                { values, purpose }: CallTemplateFunctionArgs,
            ): Promise<string | null> => {
                if (!values.cmd || !values.interpreter) return null;

                console.log(`Running command with ${values.interpreter}: ${values.cmd}`);

                let out: string;
                try {
                    out = execSync(values.cmd, {
                        shell: values.interpreter,
                        timeout: 10 * 1000,
                        encoding: "utf-8",
                    });
                } catch (err) {
                    const err_m = (err as Error).message;
                    console.error(`Command failed: ${err_m}`);
                    return err_m;
                }

                const exec_out = out.toString().trim();

                if (values.json_validation === "true") {
                    let json: object;
                    try {
                        json = JSON.parse(exec_out);
                    } catch (err) {
                        const err_m = (err as Error).message;
                        console.error(`JSON validation failed: ${err_m}`);
                        return err_m;
                    }
                    if (values.json_filter !== undefined && values.json_filter !== "") {
                        let filtered: object;
                        try {
                            filtered = JSONPath({
                                path: values.json_filter,
                                json: json,
                                wrap: false,
                            });
                            // Strip quotes from filtered object for "raw" mode
                            return JSON.stringify(filtered).replaceAll('"', "");
                        } catch (err) {
                            const err_m = (err as Error).message;
                            console.error(`JSON filtering failed: ${err_m}`);
                            return err_m;
                        }
                    }
                    return JSON.stringify(json);
                }

                return exec_out;
            },
        },
    ],
};
