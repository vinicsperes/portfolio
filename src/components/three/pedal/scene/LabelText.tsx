import React, { useCallback } from "react";
import { Text } from "@react-three/drei";
import { Material, Mesh } from "three";

/**
 * Texto do silkscreen: sempre por cima do chassi (depthTest desligado).
 *
 * O troika troca o material do mesh quando reprocessa o SDF, então isso
 * precisa ser reaplicado — mas via `onSync`, que dispara nesses momentos, e
 * não num useFrame. Eram 9 instâncias rodando um callback POR FRAME só pra
 * testar um booleano.
 */
export function LabelText(props: React.ComponentProps<typeof Text>) {
  const onSync = useCallback((mesh: Mesh) => {
    const mat = mesh?.material;
    if (mat instanceof Material) mat.depthTest = false;
  }, []);
  return <Text renderOrder={100} onSync={onSync} {...props} />;
}
