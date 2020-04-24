import { useRef, Ref } from './ref';

function extractValues(nodes: HTMLInputElement[]) {
  const values = {};
  nodes.forEach((node) => {
    if (node.type === 'submit') return;
    values[node.name] = node.value;
  });
  return values;
}

export function useForm(callback) {
  const formRef: Ref<HTMLFormElement> = useRef();
  const handleSubmit = (event) => {
    event.preventDefault();
    if (!formRef.current.checkValidity()) return;
    callback(
      extractValues(Array.from(formRef.current.elements) as HTMLInputElement[]),
    );
  };
  return [formRef, handleSubmit];
}
