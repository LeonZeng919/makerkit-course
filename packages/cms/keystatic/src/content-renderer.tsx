export function KeystaticContentRenderer(props: { content: unknown }) {
  return <div>{props.content as React.ReactNode}</div>;
}
