# MCU name
MCU                 =   atmega32u4
BOOTLOADER          =   atmel-dfu

CUSTOM_MATRIX       =   yes
VIRTSER_ENABLE      =   yes
NKRO_ENABLE         =   yes
DEBOUNCE_TYPE       =   eager_pr

# Lets try and save some space eh?
STENO_ENABLE        =   yes
MOUSEKEY_ENABLE     =   no
EXTRAKEY_ENABLE     =   no
CONSOLE_ENABLE      =   yes
COMMAND_ENABLE      =   no

VPATH               +=  keyboards/gboards/ 
#SRC(J) += g/engine.c config_engine.c
SRC                 +=  matrix.c
QUANTUM_LIB_SRC     +=  i2c_master.c
#OPT_DEFS            +=  -DONLYQWERTY 
#LTO_ENABLE          =   yes
