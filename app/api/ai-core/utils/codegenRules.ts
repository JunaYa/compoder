import { CodegenRule } from "@/lib/db/codegen/types"

const IMPORTANT_NOTE = `Important: Write the code directly inside each ComponentFile tag. Do NOT use any code block markers (like \`\`\`tsx, \`\`\`ts, etc.) inside the XML tags.

`

const defaultFileStructure = `${IMPORTANT_NOTE}Output component code in XML format as follows:
<ComponentArtifact name="ComponentName">
  <ComponentFile fileName="App.tsx" isEntryFile="true">
    import { ComponentName } from './ComponentName';
    
    const mockProps = {
      // Define mock data here
    };
    
    export default function App() {
      return <ComponentName {...mockProps} />;
    }
  </ComponentFile>
  
  <ComponentFile fileName="[ComponentName].tsx">
    // Main component implementation
    // Split into multiple files if exceeds 500 lines
  </ComponentFile>

  <ComponentFile fileName="helpers.ts">
    // Helper functions (optional)
  </ComponentFile>

  <ComponentFile fileName="interface.ts">
    // Type definitions for component props
    // All API-interacting data must be defined as props:
    // - initialData for component initialization
    // - onChange, onSave, onDelete etc. for data modifications
  </ComponentFile>
</ComponentArtifact>
`

const defaultStyles = `
Use tailwindcss to write styles
`

const defaultAdditionalRules = `
- Ensure component is fully responsive across all device sizes
- Implement proper accessibility (ARIA) attributes
- Add comprehensive PropTypes or TypeScript interfaces
- Include error handling for all async operations
- Optimize rendering performance where possible
`

export function getPublicComponentsRule(rules: CodegenRule[]) {
  return rules.find(rule => rule.type === "public-components")?.dataSet
}

export function getStylesRule(rules: CodegenRule[]) {
  return rules.find(rule => rule.type === "styles")?.prompt ?? defaultStyles
}

export function getPrivateComponentDocs(rules: CodegenRule[]) {
  return rules.find(rule => rule.type === "private-components")?.docs
}

export function getPrivateDocsDescription(rules: CodegenRule[]): string {
  const docs = getPrivateComponentDocs(rules)
  const publicLibraryComponents = getPublicComponentsRule(rules)

  // Helper function to check if public library components are valid and non-empty
  const isPublicLibraryValid = (components: string[] | undefined): boolean => {
    return !!components && Array.isArray(components) && components.length > 0
  }

  const isPrivateLibraryValid = (
    docs: Record<string, any> | undefined,
  ): boolean => {
    return !!docs && Object.keys(docs).length > 0
  }

  const hasPublicLibrary = isPublicLibraryValid(publicLibraryComponents)
  const hasPrivateLibrary = isPrivateLibraryValid(docs)

  // 当没有有效的组件库时，返回空字符串
  if (!hasPrivateLibrary && !hasPublicLibrary) {
    return ""
  }

  // Helper function to format public library components as a string
  const formatPublicLibraryComponents = (
    components: string[] | undefined,
  ): string => {
    return components?.join(", ") || ""
  }

  // If docs is empty but public library exists, return only public library description
  if (!hasPrivateLibrary) {
    return hasPublicLibrary
      ? `- All components in ${formatPublicLibraryComponents(
          publicLibraryComponents,
        )}`
      : ""
  }

  const templates: string[] = []

  // Add public library components if available
  if (hasPublicLibrary) {
    templates.push(`
        - All components in ${formatPublicLibraryComponents(
          publicLibraryComponents,
        )}
      `)
  }

  // Process private component libraries
  for (const namespace in docs) {
    if (docs.hasOwnProperty(namespace)) {
      const components = docs[namespace]
      let componentDescriptions = ""

      for (const key in components) {
        if (components.hasOwnProperty(key)) {
          const component = components[key]
          componentDescriptions += `
  ${key}: ${component.description}
  `
        }
      }

      const template = `
  - Components in ${namespace}, below are descriptions of ${namespace} components (can only use component names listed below)
  ---------------------
  ${componentDescriptions.trim()}
  ---------------------
  `
      templates.push(template.trim())
    }
  }

  return templates.join("\n\n")
}

export function getFileStructureRule(rules: CodegenRule[]) {
  const customPrompt = rules.find(
    rule => rule.type === "file-structure",
  )?.prompt
  if (customPrompt) {
    return IMPORTANT_NOTE + customPrompt
  }
  return defaultFileStructure
}

export function getSpecialAttentionRules(rules: CodegenRule[]) {
  return (
    rules.find(rule => rule.type === "attention-rules")?.prompt ??
    defaultAdditionalRules
  )
}
